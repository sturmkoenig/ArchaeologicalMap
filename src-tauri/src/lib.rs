use self::models::{Card, NewCard};
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use schema::cards::{self, id};
use std::env;

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

pub mod models;
pub mod schema;

pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();
    // TODO: Change this URL to be loaded from a conf file!
    let database_url =
        "sqlite:///Users/linuslauer/Documents/Projects/archaological-map/Frontend/test.db";

    //let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
