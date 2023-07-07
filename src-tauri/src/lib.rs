use self::models::{Card, NewCard};
use diesel::select;
use diesel::sqlite::SqliteConnection;
use diesel::{prelude::*, sql_types::Float};
use dotenvy::dotenv;
use models::{CardDTO, CardTitleMapping, Marker, MarkerDTO, NewMarker};
use schema::cards::{self, id, title};
use schema::marker::{self, latitude, longitude};
use serde_json::Error;
use std::{env, path::PathBuf};
use tauri::api::path::data_dir;

diesel::sql_function! (fn last_insert_rowid() -> diesel::sql_types::Integer);

pub fn query_create_card(card_dto: &CardDTO, conn: &mut SqliteConnection) -> i32 {
    let new_card: NewCard = NewCard {
        title: &card_dto.title,
        description: &card_dto.description,
    };

    diesel::insert_into(cards::table)
        .values(&new_card)
        .execute(conn)
        .expect("error inserting entity");

    select(last_insert_rowid())
        .first(conn)
        .expect("error getting id")
}

pub fn query_create_marker(conn: &mut SqliteConnection, card_id: i32, marker_dto: &MarkerDTO) {
    let marker: NewMarker = NewMarker {
        card_id: card_id,
        latitude: marker_dto.latitude,
        longitude: marker_dto.longitude,
        radius: marker_dto.radius,
        icon_name: &marker_dto.icon_name,
    };

    diesel::insert_into(marker::table)
        .values(&marker)
        .execute(conn)
        .expect("error creating marker");
}

pub fn query_all_markers(conn: &mut SqliteConnection) -> Vec<Marker> {
    marker::table
        .load::<Marker>(conn)
        .expect("Error could not fetch markers from database")
}

pub fn query_all_cards(conn: &mut SqliteConnection) -> Vec<Card> {
    cards::table
        .load::<Card>(conn)
        .expect("Error loading posts")
}
pub fn query_cards_paginated(
    conn: &mut SqliteConnection,
    page_number: i64,
    filter: String,
) -> Vec<Card> {
    // TODO sensible page size
    let page_size = 20;
    cards::table
        .order_by(title)
        .limit(page_size)
        .filter(title.like(format!("{}{}", filter, "%")))
        .offset(page_number * page_size)
        .load::<Card>(conn)
        .expect("Error loading")
}

pub fn query_card_by_id(conn: &mut SqliteConnection, card_id: i32) -> CardDTO {
    let card: Card = cards::table
        .find(card_id)
        .first(conn)
        .expect("Error loading posts");
    let markers: Vec<Marker> = marker::table
        .filter(marker::card_id.eq(card_id))
        .load(conn)
        .expect("error loading markers");
    let marker_dtos = markers.iter().map(|marker| marker.clone().into()).collect();
    let mut card_dto: CardDTO = card.into();
    card_dto.markers = marker_dtos;
    return card_dto;
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

pub fn query_update_card(conn: &mut SqliteConnection, update_card: Card) {
    diesel::update(cards::table)
        .filter(schema::cards::id.eq(update_card.id))
        .set(update_card)
        .execute(conn)
        .expect("Error while updating card");
}

pub fn query_update_marker(conn: &mut SqliteConnection, updated_marker: Marker) {
    diesel::update(marker::table)
        .filter(schema::marker::id.eq(updated_marker.id))
        .set(updated_marker)
        .execute(conn)
        .expect("Error while updating marker");
}

pub fn query_card_names(conn: &mut SqliteConnection) -> Vec<CardTitleMapping> {
    let mut card_mapping: Vec<CardTitleMapping> = Vec::new();
    let query_result: Vec<(i32, String)> = cards::table
        .select((id, title))
        .load(conn)
        .expect("Error creating cache");
    for res in query_result {
        card_mapping.push(CardTitleMapping {
            id: (res.0),
            title: (res.1),
        });
    }
    return card_mapping;
}

pub fn query_delete_card(conn: &mut SqliteConnection, card_id: i32) {
    diesel::delete(cards::table.filter(id.eq(card_id))).execute(conn);
}

pub fn query_delet_marker(conn: &mut SqliteConnection, marker_id: i32) {
    diesel::delete(marker::table.filter(schema::marker::id.eq(marker_id))).execute(conn);
}

pub fn query_markers_in_geological_area(
    conn: &mut SqliteConnection,
    north: f32,
    east: f32,
    south: f32,
    west: f32,
) -> Vec<Marker> {
    marker::table
        .filter(latitude.le(north))
        .filter(longitude.le(east))
        .filter(latitude.ge(south))
        .filter(longitude.ge(west))
        .load::<Marker>(conn)
        .expect("Error loading")
}

pub fn query_join_markers(conn: &mut SqliteConnection, card_id: i32) -> Vec<Marker> {
    marker::table
        .filter(schema::marker::card_id.eq(card_id))
        .load(conn)
        .expect("Error loading markers")
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
