use app::schema::cards::{id, title};
use app::{models::Card, schema::cards};
use diesel::sqlite::SqliteConnection;
use diesel::{prelude::*, QueryDsl};

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


pub fn query_delete_card(conn: &mut SqliteConnection, card_id: i32) -> Result<(), String> {
    let result = diesel::delete(cards::table.filter(id.eq(card_id))).execute(conn);
    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error deleting card: {}", e)),
    }
}

pub fn query_count_cards(conn: &mut SqliteConnection) -> i64 {
    cards::table
        .count()
        .get_result(conn)
        .expect("Error counting cards")
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
