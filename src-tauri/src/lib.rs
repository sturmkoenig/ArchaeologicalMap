use self::models::{Card, NewCard};
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use schema::cards::{self};
use std::{env, path::PathBuf};
use tauri::api::path::data_dir;

pub fn create_card(new_card: NewCard, conn: &mut SqliteConnection) -> usize {
    diesel::insert_into(cards::table)
        .values(&new_card)
        .execute(conn)
        .expect("Error saving new card")
}

pub fn query_all_cards(conn: &mut SqliteConnection) -> Vec<Card> {
    cards::table
        .limit(100)
        .load::<Card>(conn)
        .expect("Error loading posts")
}
pub fn query_cards_paginated(conn: &mut SqliteConnection, page_number: i64) -> Vec<Card> {
    let page_size = 20;
    cards::table
        .limit(page_size)
        .offset(page_number * page_size)
        .load::<Card>(conn)
        .expect("Error loading")
}

pub fn query_card_by_id(conn: &mut SqliteConnection, card_id: i32) -> Card {
    cards::table
        .find(card_id)
        .first(conn)
        .expect("Error loading posts")
}

pub fn get_local_dir() -> PathBuf {
    let mut local_dir = data_dir().unwrap().clone();
    local_dir.push(PathBuf::from("archaological-map"));
    local_dir
}

pub fn get_path_local_dir(path_name: String) -> PathBuf {
    let mut file_path = get_local_dir().clone();
    file_path.push(PathBuf::from(path_name));
    file_path
}

pub mod models;
pub mod schema;

pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();
    let connection_path = get_path_local_dir(String::from("am.db"));
    let database_url = connection_path.to_str().unwrap();

    SqliteConnection::establish(database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
