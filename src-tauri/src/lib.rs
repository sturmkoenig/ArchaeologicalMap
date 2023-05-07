use self::models::{Card, NewCard};
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use schema::cards::{self, id, title};
use std::{env, path::PathBuf};
use tauri::api::path::data_dir;

pub fn query_create_card(new_card: NewCard, conn: &mut SqliteConnection) -> usize {
    diesel::insert_into(cards::table)
        .values(&new_card)
        .execute(conn)
        .expect("Error saving new card")
}

pub fn query_all_cards(conn: &mut SqliteConnection) -> Vec<Card> {
    cards::table
        .load::<Card>(conn)
        .expect("Error loading posts")
}
pub fn query_cards_paginated(conn: &mut SqliteConnection, page_number: i64) -> Vec<Card> {
    // TODO sensible page size
    let page_size = 5;
    cards::table
        .order_by(title)
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

pub fn query_count_cards(conn: &mut SqliteConnection) -> i64 {
    cards::table
        .count()
        .get_result(conn)
        .expect("Error counting cards")
}
pub fn query_card_by_title(conn: &mut SqliteConnection, query_title: String) -> Vec<Card> {
    cards::table
        .filter(title.eq(query_title))
        .load(conn)
        .expect("Error counting cards")
}

pub fn query_update_card(conn: &mut SqliteConnection, update_card: Card) {
    diesel::update(cards::table)
        .filter(id.eq(update_card.id))
        .set(update_card)
        .execute(conn)
        .expect("Error while doing update");
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
