#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate diesel;
extern crate diesel_migrations;

pub mod persistence;
use app::models::CardDTO;
use app::models::CardTitleMapping;
use app::models::Marker;
use app::models::MarkerDTO;
use app::models::NewMarker;
use app::models::NewStack;
use app::models::Stack;
use app::models::StackDTO;
use app::schema::marker;
use app::schema::stack;
use diesel::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use persistence::cards::query_all_cards;
use persistence::cards::query_card_by_id;
use persistence::cards::query_card_names;
use persistence::cards::query_cards_in_stack;
use persistence::cards::query_cards_paginated;
use persistence::cards::query_count_cards;
use persistence::cards::query_create_card;
use persistence::cards::query_delete_card;
use persistence::cards::query_update_card;
use persistence::markers::query_create_marker;
use persistence::markers::query_delete_all_markers_for_card;
use persistence::markers::query_delete_marker;
use persistence::markers::query_join_markers;
use persistence::markers::query_markers_in_geological_area;
use persistence::markers::query_update_marker;
use persistence::stacks::query_all_stacks;
use persistence::stacks::query_create_stack;
use persistence::stacks::query_update_stack;
use tauri::api::path::app_cache_dir;

use tauri::api::path::app_data_dir;
use tauri::api::path::app_local_data_dir;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use std::env;
use std::fs;

use app::{establish_connection, models::Card};

// main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_card,
            read_card,
            read_cards,
            read_cards_paginated,
            update_card,
            count_cards,
            write_card_content,
            read_card_content,
            cache_card_names,
            delete_card,
            create_marker,
            read_markers_in_area,
            delete_marker,
            create_stack,
            update_stack,
            read_all_stacks,
            get_cards_in_stack
        ])
        .setup(|app| {
            let config = app.config();

            let mut data_path = app_local_data_dir(&config).unwrap();
            if !data_path.exists() {
                std::fs::create_dir_all(data_path)?;
            }

            let conn = &mut establish_connection();
            // TODO handle error
            conn.run_pending_migrations(MIGRATIONS);

            let mut app_dir = app_data_dir(&config).expect("error creating app data dir");
            fs::create_dir(&app_dir);
            app_dir.push("content");
            fs::create_dir(app_dir);
            let cache_dir = app_cache_dir(&config).expect("error resolving cache dir");
            fs::create_dir(cache_dir);
            let mut images_dir = app_data_dir(&config).expect("error creating app data dir");
            images_dir.push("content");
            images_dir.push("images");
            fs::create_dir(images_dir);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn read_cards() -> Vec<Card> {
    let conn = &mut establish_connection();
    query_all_cards(conn)
}

#[tauri::command]
fn read_cards_paginated(page: i64, filter: String) -> Vec<CardDTO> {
    let conn = &mut establish_connection();
    let cards = query_cards_paginated(conn, page, filter);
    let mut card_dtos: Vec<CardDTO> = Vec::new();

    for card in cards.iter() {
        let markers_for_card = query_join_markers(conn, card.id);
        let mut markers: Vec<MarkerDTO> = Vec::new();
        for marker in markers_for_card.iter() {
            markers.push(MarkerDTO {
                id: Some(marker.id),
                card_id: Some(card.id),
                longitude: marker.longitude,
                radius: marker.radius,
                latitude: marker.latitude,
                icon_name: marker.icon_name.clone(),
            });
        }
        card_dtos.push(CardDTO {
            id: Some(card.id),
            title: card.title.clone(),
            description: card.description.clone(),
            markers: markers,
            stack_id: card.stack_id,
        })
    }
    return card_dtos;
}

#[tauri::command]
fn read_card(id: i32) -> CardDTO {
    let conn = &mut establish_connection();
    query_card_by_id(conn, id)
}

#[tauri::command]
fn create_card(card: CardDTO) -> CardDTO {
    let conn = &mut establish_connection();
    let card_id = query_create_card(&card, conn);

    for marker in card.markers.iter() {
        query_create_marker(conn, card_id, marker);
    }
    read_card(card_id)
}

// TODO may be moved to frontend
#[tauri::command]
fn read_card_content(app_handle: tauri::AppHandle, id: String) -> Option<String> {
    let mut app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("error getting app dir");
    app_dir.push(format!("content/{}.json", id));
    let content = fs::read_to_string(app_dir);
    match content {
        Ok(content) => return Some(content),
        Err(_e) => return None,
    }
}

#[tauri::command]
fn write_card_content(app_handle: tauri::AppHandle, id: String, content: String) {
    let mut content_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("error getting data dir");
    content_dir.push(format!("content/{}.json", id));
    fs::write(content_dir, content).expect("error opening file");
}

// updates card. Markers send with the card are updated as well when they have an id.
// If the send marker has no id, it will be created. If a marker is missing from the card
// it is not deleted!
#[tauri::command]
fn update_card(card: CardDTO) -> bool {
    let conn = &mut establish_connection();
    if card.id.is_none() {
        return false;
    }
    query_update_card(
        conn,
        Card {
            id: card.id.unwrap(),
            title: card.title,
            description: card.description,
            stack_id: card.stack_id,
        },
    );
    create_markers_from_marker_dtos(card.id.unwrap(), card.markers, conn);

    return true;
}

fn create_markers_from_marker_dtos(
    card_id: i32,
    markers: Vec<MarkerDTO>,
    conn: &mut SqliteConnection,
) {
    for marker in markers.iter() {
        match marker.id {
            Some(id) => query_update_marker(
                conn,
                Marker {
                    id: id,
                    card_id: card_id,
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    radius: marker.radius,
                    icon_name: marker.icon_name.clone(),
                },
            ),
            None => {
                let _ = query_create_marker(conn, card_id, marker);
            }
        }
    }
}

#[tauri::command]
fn count_cards() -> i64 {
    let conn = &mut establish_connection();
    query_count_cards(conn)
}

#[tauri::command]
fn delete_card(id: i32) {
    let conn = &mut establish_connection();
    query_delete_card(conn, id);
    query_delete_all_markers_for_card(conn, id);
}

#[tauri::command]
fn delete_marker(marker_id: i32) {
    let conn = &mut establish_connection();
    query_delete_marker(conn, marker_id);
}

#[tauri::command]
fn cache_card_names(app_handle: tauri::AppHandle) {
    let conn = &mut establish_connection();
    let card_names: Vec<CardTitleMapping> = query_card_names(conn);
    let json_card_names = serde_json::to_string(&card_names).expect("error");
    let mut card_name_cache_path = app_handle
        .path_resolver()
        .app_cache_dir()
        .expect("error resolving cache dir");
    card_name_cache_path.push("card_names.json");
    fs::write(card_name_cache_path, json_card_names).expect("couldn't write to file system");
}

#[tauri::command]
fn read_markers_in_area(north: f32, east: f32, south: f32, west: f32) -> Vec<Marker> {
    let conn = &mut establish_connection();
    let results = query_markers_in_geological_area(conn, north, east, south, west);
    results
}
// TODO Add mehtod that sends number of entries!

#[tauri::command]
fn read_all_stacks() -> Vec<StackDTO> {
    let conn = &mut establish_connection();
    let stacks = query_all_stacks(conn);
    let mut stackDTOs: Vec<StackDTO> = Vec::new();
    for stack in stacks.iter() {
        stackDTOs.push(StackDTO::from(stack.clone()))
    }
    return stackDTOs;
}

// TODO implement methods
#[tauri::command]
fn get_cards_in_stack(stack_id: i32) -> Vec<CardDTO> {
    let conn = &mut establish_connection();
    query_cards_in_stack(conn, stack_id)
}

#[tauri::command]
fn create_stack(stack: NewStack) -> Stack {
    let conn = &mut establish_connection();
    query_create_stack(conn, &stack)
}

#[tauri::command]
fn update_stack(updated_stack: Stack) -> Stack {
    let conn = &mut establish_connection();
    query_update_stack(conn, &updated_stack)
}

#[tauri::command]
fn create_marker(new_marker: MarkerDTO, card_id: i32) -> Marker {
    let conn = &mut establish_connection();
    query_create_marker(conn, card_id, &new_marker)
}

fn add_card_to_stack(card_id: i32, stack_id: i32) {}
