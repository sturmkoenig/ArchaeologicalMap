use app::last_insert_rowid;
use app::models::{CardDTO,  Marker, NewCard};
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
    let page_size = 1000;
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
        .expect("Error loading sqlite");
    let markers: Vec<Marker> = marker::table
        .filter(marker::card_id.eq(card_id))
        .load(conn)
        .expect("error loading markers");
    let marker_dtos = markers.iter().map(|marker| marker.clone().into()).collect();
    let mut card_dto: CardDTO = card.into();
    card_dto.markers = marker_dtos;
    return card_dto;
}

pub fn query_delete_card(conn: &mut SqliteConnection, card_id: i32) -> Result<(), String> {
    let result = diesel::delete(cards::table.filter(id.eq(card_id))).execute(conn);
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error deleting card: {}", e)),
    }
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
        stack_id: card_dto.stack_id,
    };

    diesel::insert_into(cards::table)
        .values(&new_card)
        .execute(conn)
        .expect("error inserting entity");

    select(last_insert_rowid())
        .first(conn)
        .expect("error getting id")
}

pub fn query_cards_in_stack(conn: &mut SqliteConnection, stack_id: i32) -> Vec<CardDTO> {
    let cards = cards::table
        .filter(schema::cards::stack_id.eq(stack_id))
        .order(schema::cards::stack_id)
        .load(conn)
        .expect("error loading cards in stack");
    let markers: Vec<Marker> = marker::table
        .filter(marker::card_id.eq_any(cards.iter().map(|card: &Card| card.id)))
        .load(conn)
        .expect("error loading markers");
    let mut card_dtos: Vec<CardDTO> = Vec::new();
    for card in cards {
        let marker_dtos = markers
            .iter()
            .filter(|marker| marker.card_id.eq(&card.id))
            .map(|marker| marker.clone().into())
            .collect();
        let mut card_dto: CardDTO = card.into();
        card_dto.markers = marker_dtos;
        card_dtos.push(card_dto);
    }
    return card_dtos;
}

pub fn query_set_image_to_null(conn: &mut SqliteConnection, image_id: i32) -> Result<(), String> {
    let resutl = diesel::update(cards::table.filter(cards::region_image_id.eq(Some(image_id))))
        .set(cards::region_image_id.eq(None::<i32>))
        .execute(conn);
    return match resutl {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error errasing image from cards: {}", e)),
    };
}
