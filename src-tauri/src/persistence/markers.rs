use app::{
    last_insert_rowid,
    models::{Marker, MarkerDTO, NewMarker},
    schema::{
        self,
        marker::{self, latitude, longitude},
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
        card_id: card_id,
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

pub fn query_all_markers(conn: &mut SqliteConnection) -> Vec<Marker> {
    marker::table
        .load::<Marker>(conn)
        .expect("Error could not fetch markers from database")
}

pub fn query_update_marker(conn: &mut SqliteConnection, updated_marker: Marker) {
    diesel::update(marker::table)
        .filter(schema::marker::id.eq(updated_marker.id))
        .set(updated_marker)
        .execute(conn)
        .expect("Error while updating marker");
}

pub fn query_delete_marker(conn: &mut SqliteConnection, marker_id: i32) {
    diesel::delete(marker::table.filter(schema::marker::id.eq(marker_id))).execute(conn);
}

pub fn query_delete_all_markers_for_card(conn: &mut SqliteConnection, card_id: i32) {
    diesel::delete(marker::table.filter(schema::marker::card_id.eq(card_id))).execute(conn);
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
pub fn query_marker_by_id(conn: &mut SqliteConnection, marker_id: i32) -> Marker {
    marker::table
        .filter(schema::marker::id.eq(marker_id))
        .first(conn)
        .expect("Error loading marker")
}

pub fn query_join_markers(conn: &mut SqliteConnection, card_id: i32) -> Vec<Marker> {
    marker::table
        .filter(schema::marker::card_id.eq(card_id))
        .load(conn)
        .expect("Error loading markers")
}
