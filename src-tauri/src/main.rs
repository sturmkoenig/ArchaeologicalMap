#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use std::env;
use std::fs;

use app::create_card;
use app::models::NewCard;
use app::{establish_connection, models::Card, query_all_cards, query_card_by_id};

// main.rs
fn main() {
    let conn = &mut establish_connection();
    conn.run_pending_migrations(MIGRATIONS);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_cards,
            read_cards_paginated,
            read_card,
            read_card_content,
            write_card,
            write_card_content
        ])
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
    let results = query_all_cards(conn);
    return results;
}

#[tauri::command]
fn read_card(card_id: i32) -> Card {
    let conn = &mut establish_connection();
    query_card_by_id(conn, card_id)
}

#[tauri::command]
fn write_card(card: NewCard) {
    let conn = &mut establish_connection();
    create_card(card, conn);
}

#[tauri::command]
fn read_card_content(id: String) -> String {
    let content = fs::read_to_string(format!(
        "/Users/linuslauer/Documents/Projects/archaological-map/Middleware/content/{}.json",
        id
    ));
    match content {
        Ok(content) => return content,
        Err(e) => return String::from("no content"),
    }
}

#[tauri::command]
fn write_card_content(id: String, content: String) {
    println!("received content: {}", content);
    fs::write(
        format!(
            "/Users/linuslauer/Documents/Projects/archaological-map/Middleware/content/{}.json",
            id
        ),
        content,
    )
    .expect("error opening file");
}
