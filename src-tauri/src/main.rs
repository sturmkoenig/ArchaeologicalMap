#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate diesel;
extern crate diesel_migrations;

pub mod persistence;
use app::models::CardDTO;
use app::models::CardTitleMapping;
use app::models::ImageDTO;
use app::models::Marker;
use app::models::MarkerDTO;
use app::models::NewImage;
use app::models::NewStack;
use app::models::Stack;
use app::models::StackDTO;
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
use persistence::images::query_create_image;
use persistence::markers::query_create_marker;
use persistence::markers::query_delete_all_markers_for_card;
use persistence::markers::query_delete_marker;
use persistence::markers::query_join_markers;
use persistence::markers::query_marker_by_id;
use persistence::markers::query_markers_in_geological_area;
use persistence::markers::query_update_marker;
use persistence::stacks::query_all_stacks;
use persistence::stacks::query_create_stack;
use persistence::stacks::query_delete_stack;
use persistence::stacks::query_update_stack;
use tauri::api::path::app_cache_dir;

use tauri::api::path::app_data_dir;
use tauri::api::path::app_local_data_dir;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use std::env;
use std::fs;
use std::path::Path;
use tauri::AppHandle;

use app::{establish_connection, models::Card};

use crate::persistence::images::query_update_image;

// main.rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
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
            read_marker,
            read_markers_in_area,
            update_marker,
            delete_marker,
            create_stack,
            update_stack,
            delete_stack,
            read_all_stacks,
            get_cards_in_stack,
            create_image,
            read_image,
            read_images,
            read_images_paginated,
            delete_image,
        ])
        .setup(|app| {
            let config = app.config();

            let data_path = app_local_data_dir(&config).unwrap();
            if !data_path.exists() {
                std::fs::create_dir_all(data_path)?;
            }

            let conn = &mut establish_connection();
            // TODO handle error
            let err = conn.run_pending_migrations(MIGRATIONS);

            if let Err(e) = err {
                println!("Error running migrations: {:?}", e);
            }

            let mut app_dir = app_data_dir(&config).expect("error creating app data dir");
            let err = fs::create_dir(&app_dir);
            if let Err(e) = err {
                println!("Error creating app dir: {:?}", e);
            }

            let mut content_dir = app_dir.clone();
            content_dir.push("content");
            let mut images_dir = content_dir.clone();
            images_dir.push("images");
            let err = fs::create_dir(content_dir);
            if let Err(e) = err {
                println!("Error creating content dir: {:?}", e);
            }
            let err = fs::create_dir(images_dir);
            if let Err(e) = err {
                println!("Error creating images dir: {:?}", e);
            }

            let cache_dir = app_cache_dir(&config).expect("error resolving cache dir");

            let err = fs::create_dir(cache_dir);
            if let Err(e) = err {
                println!("Error creating cache dir: {:?}", e);
            }

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
            markers,
            stack_id: card.stack_id,
            region_image_id: card.region_image_id,
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
            region_image_id: card.region_image_id,
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
                    id,
                    card_id,
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
    query_delete_all_markers_for_card(conn, id);
    query_delete_card(conn, id);
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

#[tauri::command]
fn read_marker(id: i32) -> Marker {
    let conn = &mut establish_connection();
    query_marker_by_id(conn, id)
}
// TODO Add mehtod that sends number of entries!

#[tauri::command]
fn update_marker(marker: Marker) {
    let conn = &mut establish_connection();
    query_update_marker(conn, marker);
}

#[tauri::command]
fn read_all_stacks() -> Vec<StackDTO> {
    let conn = &mut establish_connection();
    let stacks = query_all_stacks(conn);
    let mut stack_dtos: Vec<StackDTO> = Vec::new();
    for stack in stacks.iter() {
        stack_dtos.push(StackDTO::from(stack.clone()))
    }
    stack_dtos
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

#[tauri::command]
fn delete_stack(stack_id: i32) -> Option<bool> {
    let conn = &mut establish_connection();
    query_delete_stack(conn, stack_id);
    Some(true)
}

#[tauri::command]
fn create_image(
    app_handle: AppHandle,
    image_path: String,
    image_name: String,
    image_description: Option<String>,
) {
    let conn = &mut establish_connection();
    let new_image: NewImage = NewImage {
        name: &image_name,
        image_source: std::option::Option::None,
    };
    let image_id = query_create_image(conn, &new_image);
    let config = app_handle.config();
    let app_data_dir = app_data_dir(&config).expect("error creating app data dir");
    println!("app_data_dir: {:?}", app_data_dir);
    println!("image_path: {:?}", image_path);
    println!("image_id: {}", image_id);

    let file_name = Path::new(&image_path)
        .file_name()
        .and_then(|fname| fname.to_str())
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid file name"))
        .unwrap();

    let file_stem = Path::new(&image_path)
        .file_stem()
        .and_then(|fname| fname.to_str())
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid file stem"))
        .unwrap();

    let extension = Path::new(&image_path)
        .extension()
        .and_then(|fname| fname.to_str())
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid extension"))
        .unwrap();

    println!("file_stem: {:?}", file_stem);
    let new_image_name = format!("{}_{}.{}", image_id, file_stem, extension);
    let app_image_dir = "content/images/";
    println!("new_image_name: {:?}", new_image_name);
    let dest_path = app_data_dir.join(format!("{}{}", app_image_dir, new_image_name));
    let _ = fs::copy(image_path, dest_path).or_else(|e| {
        println!("Error copying image: {:?}", e);
        Err(e)
    });
    let image_source = Some(format!("{}{}", app_image_dir, new_image_name));
    println!("image_source: {:?}", image_source);
    let image_dto = ImageDTO {
        id: image_id,
        name: image_name,
        image_source,
    };
    query_update_image(conn, &image_dto);
}

#[tauri::command]
fn read_image(image_id: i32) -> ImageDTO {
    let conn = &mut establish_connection();
    let image = persistence::images::query_read_image(conn, image_id);

    ImageDTO {
        id: image.id,
        name: image.name,
        image_source: Some(image.image_source),
    }
}

#[tauri::command]
fn delete_image(image_id: i32) {
    let conn = &mut establish_connection();
    persistence::cards::query_set_image_to_null(conn, image_id);
    persistence::images::query_delete_image(conn, image_id);
}

#[tauri::command]
fn read_images() -> Vec<ImageDTO> {
    let conn = &mut establish_connection();
    let images = persistence::images::query_read_images(conn);
    let mut image_dtos: Vec<ImageDTO> = Vec::new();
    for image in images.iter() {
        image_dtos.push(ImageDTO {
            id: image.id,
            name: image.name.clone(),
            image_source: Some(image.image_source.clone()),
        });
    }
    image_dtos
}

#[tauri::command]
fn read_images_paginated(
    entries_per_page: i64,
    page_number: i64,
    title_filter: Option<String>,
) -> (Vec<ImageDTO>, i64) {
    let conn = &mut establish_connection();
    let images = persistence::images::query_read_images_paginated(
        conn,
        page_number,
        entries_per_page,
        title_filter.clone(),
    );
    let mut image_dtos: Vec<ImageDTO> = Vec::new();
    for image in images.iter() {
        image_dtos.push(ImageDTO {
            id: image.id,
            name: image.name.clone(),
            image_source: Some(image.image_source.clone()),
        });
    }
    let number_of_images = persistence::images::query_count_images(conn, title_filter.clone());
    (image_dtos, number_of_images)
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 5);
    }
}
