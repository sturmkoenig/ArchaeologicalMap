use app::models::{Card, CardDTO, CardinalDirections, NewCard};
use app::schema;
use app::schema::card::dsl::card;
use app::schema::card::{latitude, longitude};
use diesel::associations::HasTable;
use diesel::{ExpressionMethods, TextExpressionMethods};
use diesel::{QueryDsl, QueryResult, RunQueryDsl, SqliteConnection};

pub fn query_card_by_id(
    conn: &mut SqliteConnection,
    card_id: i32,
) -> QueryResult<CardDTO> {
    card::find(card::table(), card_id)
        .first::<Card>(conn)
        .map(CardDTO::from)
}
pub fn query_delete_card(
    conn: &mut SqliteConnection,
    id: i32,
) -> QueryResult<()> {
    diesel::delete(card::table().filter(schema::card::id.eq(id))).execute(conn).map(|_| ())
}

pub fn query_cards_in_stack(
    conn: &mut SqliteConnection,
    stack_id: i32,
) -> QueryResult<Vec<Card>> {
    card::table()
        .filter(schema::card::stack_id.eq(stack_id))
        .load(conn)
}
pub fn query_card_by_title(
conn: &mut SqliteConnection,
title: String,
limit: i64
) -> QueryResult<Vec<Card>> {
    card::table().filter(schema::card::title.like(format!("%{}%", title))).order_by(schema::card::title).limit(limit).get_results(conn)
}

pub fn query_create_card(
    conn: &mut SqliteConnection,
    card_unified_dto: CardDTO,
) -> QueryResult<Card> {
    let new_card = NewCard {
        title: &card_unified_dto.title.unwrap_or_default(),
        description: &card_unified_dto.description.unwrap_or_default(),
        longitude: card_unified_dto.longitude,
        latitude: card_unified_dto.latitude,
        radius: card_unified_dto.radius.unwrap_or_default(),
        icon_name: card_unified_dto.icon_name.as_str(),
        stack_id: card_unified_dto.stack_id,
        region_image_id: card_unified_dto.region_image_id,
    };

    diesel::insert_into(card::table())
        .values(new_card)
        .get_result(conn)
}

pub fn query_cards_in_geological_area(
    conn: &mut SqliteConnection,
    cardinal_directions: CardinalDirections,
) -> QueryResult<Vec<Card>> {
    card::table()
        .filter(latitude.le(cardinal_directions.north))
        .filter(longitude.le(cardinal_directions.east))
        .filter(latitude.ge(cardinal_directions.south))
        .filter(longitude.ge(cardinal_directions.west))
        .load::<Card>(conn)
}

pub fn query_update_card(
    conn: &mut SqliteConnection,
    update_card: Card,
) -> QueryResult<bool> {
    let target = card.find(update_card.id);

    diesel::update(target)
        .set(update_card)
        .execute(conn)
        .map(|_| true)
}

pub fn query_set_image_to_null(conn: &mut SqliteConnection, image_id: i32) -> QueryResult<usize> {
    diesel::update(card::filter(
        schema::card::table,
        schema::card::region_image_id.eq(Some(image_id)),
    ))
    .set(schema::card::region_image_id.eq(None::<i32>))
    .execute(conn)
}
