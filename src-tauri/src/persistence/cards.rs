use app::last_insert_rowid;
use app::models::{CardDTO, CardTitleMapping, Marker, NewCard};
use app::schema::cards::{id, title};
use app::schema::{self, marker};
use app::{models::Card, schema::cards};
use diesel::select;
use diesel::sqlite::SqliteConnection;
use diesel::{prelude::*, QueryDsl};

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

pub fn query_update_card(conn: &mut SqliteConnection, update_card: Card) {
    diesel::update(cards::table)
        .filter(schema::cards::id.eq(update_card.id))
        .set(update_card)
        .execute(conn)
        .expect("Error while updating card");
}

pub fn query_count_cards(conn: &mut SqliteConnection) -> i64 {
    cards::table
        .count()
        .get_result(conn)
        .expect("Error counting cards")
}

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