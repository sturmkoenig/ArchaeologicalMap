use app::{
    last_insert_rowid,
    models::{Marker, MarkerDTO, NewMarker},
    schema::{
        self,
        marker::{self},
    },
};
use diesel::{prelude::*, QueryDsl};
use diesel::{select, SqliteConnection};

pub fn query_create_marker(
    conn: &mut SqliteConnection,
    card_id: i32,
    marker_dto: &MarkerDTO,
) -> Marker {
    let marker: NewMarker = NewMarker {
        card_id,
        latitude: marker_dto.latitude,
        longitude: marker_dto.longitude,
        radius: marker_dto.radius,
        icon_name: &marker_dto.icon_name,
    };

    diesel::insert_into(marker::table)
        .values(&marker)
        .execute(conn)
        .expect("error creating new marker");

    let marker_id: i32 = select(last_insert_rowid())
        .first(conn)
        .expect("error getting id of newly created marker");

    marker::table
        .filter(marker::id.eq(marker_id))
        .first::<Marker>(conn)
        .expect("error reading newly created marker from db")
}


pub fn query_delete_all_markers_for_card(conn: &mut SqliteConnection, card_id: i32) {
    let result =
        diesel::delete(marker::table.filter(schema::marker::card_id.eq(card_id))).execute(conn);
    if let Err(e) = result {
        panic!(
            "Error deleting markers for card with id: {}, produced error {}",
            card_id, e
        )
    }
}


pub fn query_join_markers(conn: &mut SqliteConnection, card_id: i32) -> Vec<Marker> {
    marker::table
        .filter(schema::marker::card_id.eq(card_id))
        .load(conn)
        .expect("Error loading markers")
}
