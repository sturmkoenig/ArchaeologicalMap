use self::models::{Card, NewCard};
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use schema::cards;
use std::env;

pub fn create_card(new_card: NewCard, conn: &mut SqliteConnection) -> usize {
    diesel::insert_into(cards::table)
        .values(&new_card)
        .execute(conn)
        .expect("Error saving new card")
}

pub fn query_all_cards(conn: &mut SqliteConnection) -> Vec<Card> {
    cards::table
        .limit(5)
        .load::<Card>(conn)
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
