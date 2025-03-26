use diesel::{select, QueryDsl, QueryResult, RunQueryDsl, SqliteConnection};
use diesel::associations::HasTable;
use diesel::ExpressionMethods;
use app::last_insert_rowid;
use app::models::{CardUnified, CardUnifiedDTO, CardinalDirections, Marker, NewUnifiedCard};
use app::schema::card_new::dsl::card_new;
use app::schema::card_new::{latitude, longitude};

pub fn query_unified_card_by_id(conn: &mut SqliteConnection, card_id: i32) -> Option<CardUnifiedDTO>{
    let card: Option<CardUnified> = card_new::find(card_new::table(), card_id).first(conn).ok();
    match card {
        Some(c) => Some(CardUnifiedDTO::from(c)),
        None => None
    }
}

pub fn query_create_unified_card(conn: &mut SqliteConnection, card_unified_dto: CardUnifiedDTO) -> i32 {
    let new_card = NewUnifiedCard {
        title: &card_unified_dto.title.unwrap_or_default(),
        description: &card_unified_dto.description.unwrap_or_default(),
        longitude: card_unified_dto.longitude,
        latitude: card_unified_dto.latitude,
        radius: card_unified_dto.radius.unwrap_or_default(),
        icon_name: card_unified_dto.icon_name.as_str(),
    };

    diesel::insert_into(card_new::table())
        .values(&new_card)
        .execute(conn)
        .expect("error inserting entity");

    select(last_insert_rowid())
        .first(conn)
        .expect("error getting id")
}

pub fn query_cards_in_geological_area(conn: &mut SqliteConnection, cardinal_directions: CardinalDirections) -> QueryResult<Vec<CardUnified>> {
   card_new::table()
       .filter(latitude.le(cardinal_directions.north))
       .filter(longitude.le(cardinal_directions.east))
       .filter(latitude.ge(cardinal_directions.south))
       .filter(longitude.ge(cardinal_directions.west))
       .load::<CardUnified>(conn)
}
