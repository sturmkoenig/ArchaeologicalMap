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
use app::{establish_connection, models::Card, query_all_cards};

// main.rs
fn main() {
    let conn = &mut establish_connection();
    conn.run_pending_migrations(MIGRATIONS);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            read_cards,
            read_card_content,
            write_card
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn read_cards() -> Vec<Card> {
    let conn = &mut establish_connection();
    let results = query_all_cards(conn);
    return results;
}

#[tauri::command]
fn write_card(card: NewCard) {
    println!(
        "received Card with title: {} and descr: {}",
        card.title, card.description
    );
    let conn = &mut establish_connection();
    create_card(card, conn);
}

#[tauri::command]
fn read_card_content(id: String) -> String {
    fs::read_to_string(format!(
        "/Users/linuslauer/Documents/Projects/archaological-map/Middleware/content/{}.json",
        id
    ))
    .expect("was not able to read the file")
}
