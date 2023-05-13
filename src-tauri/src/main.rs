#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate diesel;
extern crate diesel_migrations;

use app::query_card_by_title;
use app::query_cards_paginated;
use app::query_count_cards;
use app::query_update_card;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use tauri::api::path::app_local_data_dir;
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use std::env;
use std::fs;
use std::path::PathBuf;

use app::models::NewCard;
use app::query_create_card;
use app::{
    establish_connection, get_path_local_dir, models::Card, query_all_cards, query_card_by_id,
};

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
            write_card,
            write_card_content,
            read_card_content,
        ])
        .setup(|app| {
            let config = app.config();

            let mut database_path = app_local_data_dir(&config).unwrap();
            database_path.push(PathBuf::from("am.db"));

            let conn = &mut establish_connection();
            // TODO handle error
            conn.run_pending_migrations(MIGRATIONS);

            // TODO create necessary dirs
            let content_dir_path = get_path_local_dir(String::from("content"));
            fs::create_dir(content_dir_path);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn read_cards() -> Vec<Card> {
    let conn = &mut establish_connection();
    let results = query_all_cards(conn);
    return results;
}

#[tauri::command]
fn read_cards_paginated(page: i64) -> Vec<Card> {
    let conn = &mut establish_connection();
    let results = query_cards_paginated(conn, page);
    return results;
}

#[tauri::command]
fn read_card(id: i32) -> Card {
    let conn = &mut establish_connection();
    query_card_by_id(conn, id)
}

#[tauri::command]
fn read_cards_by_title(title: String) -> Vec<Card> {
    let conn = &mut establish_connection();
    query_card_by_title(conn, title)
}

#[tauri::command]
fn create_card(card: NewCard) {
    println!("received card: {}", card);
    let conn = &mut establish_connection();
    query_create_card(card, conn);
}

// TODO may be moved to frontend
#[tauri::command]
fn read_card_content(id: String) -> String {
    let content = fs::read_to_string(get_path_local_dir(
        format!("content/{}.json", id).to_string(),
    ));
    match content {
        Ok(content) => return content,
        Err(_e) => return String::from("no content"),
    }
}

#[tauri::command]
fn write_card_content(id: String, content: String) {
    fs::write(get_path_local_dir(format!("content/{}.json", id)), content)
        .expect("error opening file");
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
fn write_card(card: NewCard) {
    let conn = &mut establish_connection();
    query_create_card(card, conn);
}

// TODO Add mehtod that sends number of entries!
