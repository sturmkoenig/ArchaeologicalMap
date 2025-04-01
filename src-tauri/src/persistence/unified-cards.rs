use app::models::{CardUnified, CardUnifiedDTO, CardinalDirections, NewUnifiedCard};
use app::schema::card_new::dsl::card_new;
use app::schema::card_new::{latitude, longitude};
use app::schema;
use diesel::associations::HasTable;
use diesel::ExpressionMethods;
use diesel::{QueryDsl, QueryResult, RunQueryDsl, SqliteConnection};

pub fn query_unified_card_by_id(conn: &mut SqliteConnection, card_id: i32) -> QueryResult<CardUnifiedDTO>{
    card_new::find(card_new::table(), card_id).first::<CardUnified>(conn).map(CardUnifiedDTO::from)
}


pub fn query_unified_cards_in_stack(conn: &mut SqliteConnection, stack_id: i32) -> QueryResult<Vec<CardUnified>> {
   card_new::table().filter(schema::card_new::stack_id.eq(stack_id))
       .load(conn)
}

pub fn query_create_unified_card(conn: &mut SqliteConnection, card_unified_dto: CardUnifiedDTO) -> QueryResult<CardUnified> {
    let new_card = NewUnifiedCard {
        title: &card_unified_dto.title.unwrap_or_default(),
        description: &card_unified_dto.description.unwrap_or_default(),
        longitude: card_unified_dto.longitude,
        latitude: card_unified_dto.latitude,
        radius: card_unified_dto.radius.unwrap_or_default(),
        icon_name: card_unified_dto.icon_name.as_str(),
        stack_id: card_unified_dto.stack_id,
        region_image_id: card_unified_dto.region_image_id
    };

    diesel::insert_into(card_new::table())
        .values(new_card)
        .get_result(conn)
}

pub fn query_cards_in_geological_area(conn: &mut SqliteConnection, cardinal_directions: CardinalDirections) -> QueryResult<Vec<CardUnified>> {
   card_new::table()
       .filter(latitude.le(cardinal_directions.north))
       .filter(longitude.le(cardinal_directions.east))
       .filter(latitude.ge(cardinal_directions.south))
       .filter(longitude.ge(cardinal_directions.west))
       .load::<CardUnified>(conn)
}

pub fn query_update_unified_card(conn: &mut SqliteConnection, update_card: CardUnified) -> QueryResult<bool> {

    let target = card_new.find(update_card.id);
    
    diesel::update(target)
        .set(update_card)
        .execute(conn).map(|_| true)
}
