#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate diesel;
extern crate diesel_migrations;

use app::models::CardDTO;
use app::models::CardTitleMapping;
use app::models::Marker;
use app::query_card_names;
use app::query_cards_paginated;
use app::query_count_cards;
use app::query_create_marker;
use app::query_delete_card;
use app::query_markers_in_geological_area;
use app::query_update_card;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use tauri::api::path::app_cache_dir;
use tauri::api::path::app_config_dir;
use tauri::api::path::app_data_dir;
use tauri::api::path::app_local_data_dir;
use tauri::AppHandle;
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use std::env;
use std::fs;
use std::path::PathBuf;

use app::models::NewCard;
use app::query_create_card;
use app::{
    establish_connection, get_path_local_dir, models::Card, query_all_cards, query_card_by_id,
};

const CONTENTDIR: &str = "content";
const CACHEDIR: &str = "cache";

// main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_card,
            read_card,
            read_cards,
            read_cards_paginated,
            read_markers_in_area,
            update_card,
            count_cards,
            write_card_content,
            read_card_content,
            cache_card_names,
            delete_card
        ])
        .setup(|app| {
            let config = app.config();

            let mut database_path = app_local_data_dir(&config).unwrap();
            database_path.push(PathBuf::from("am.db"));

            let conn = &mut establish_connection();
            // TODO handle error
            conn.run_pending_migrations(MIGRATIONS);

            let mut app_dir = app_data_dir(&config).expect("a");
            fs::create_dir(&app_dir);
            app_dir.push("content");
            fs::create_dir(app_dir);
            let cache_dir = app_cache_dir(&config).expect("couold not resolve cache dir");
            fs::create_dir(cache_dir);

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
fn read_cards_paginated(page: i64, filter: String) -> Vec<Card> {
    let conn = &mut establish_connection();
    query_cards_paginated(conn, page, filter)
}

#[tauri::command]
fn read_card(id: i32) -> Card {
    let conn = &mut establish_connection();
    query_card_by_id(conn, id)
}

#[tauri::command]
fn create_card(card: CardDTO) {
    let conn = &mut establish_connection();
    let card_id = query_create_card(&card, conn);

    for marker in card.markers.iter() {
        query_create_marker(conn, card_id, marker)
    }
}

// TODO may be moved to frontend
#[tauri::command]
fn read_card_content(app_handle: tauri::AppHandle, id: String) -> String {
    let mut app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("error getting app dir");
    app_dir.push(format!("content/{}.json", id));
    println!("{}", app_dir.to_str().expect("msg"));
    let content = fs::read_to_string(app_dir);
    match content {
        Ok(content) => return content,
        Err(_e) => return String::from("no content"),
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

#[tauri::command]
fn update_card(card: Card) {
    let conn = &mut establish_connection();
    query_update_card(conn, card);
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
    println!("{:?}", results);
    results
}
// TODO Add mehtod that sends number of entries!
