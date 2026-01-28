use crate::diesel::RunQueryDsl;
use app::{
    models::{Image, NewImage, UpdateImage},
    schema::image,
};
use diesel::expression_methods::ExpressionMethods;
use diesel::SqliteConnection;
use diesel::{define_sql_function, select, QueryDsl, QueryResult, TextExpressionMethods};
use std::time::{SystemTime, UNIX_EPOCH};

define_sql_function!(fn last_insert_rowid() -> Integer);

pub fn query_create_image(conn: &mut SqliteConnection, new_image: &NewImage) -> i32 {
    diesel::insert_into(image::table)
        .values(new_image)
        .execute(conn)
        .expect("error inserting entity");

    select(last_insert_rowid())
        .first(conn)
        .expect("error getting id")
}

pub fn query_delete_image(conn: &mut SqliteConnection, image_id: i32) -> Result<(), String> {
    match diesel::delete(image::table.find(image_id)).execute(conn) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error deleting image, {}", e).to_string()),
    }
}

pub fn query_read_image(conn: &mut SqliteConnection, image_id: i32) -> Image {
    image::table
        .find(image_id)
        .first(conn)
        .expect("Error reading image")
}
pub fn query_update_image(conn: &mut SqliteConnection, update_image: &UpdateImage) {
    diesel::update(image::table.find(update_image.id))
        .set(update_image)
        .execute(conn)
        .expect("Error updating image");
}

pub fn query_update_image_name(conn: &mut SqliteConnection, image_id: i32, new_name: String) {
    diesel::update(image::table.find(image_id))
        .set(image::name.eq(new_name))
        .execute(conn)
        .expect("Error updating image name");
}

pub fn query_update_image_last_used(
    conn: &mut SqliteConnection,
    image_id: i32,
) -> QueryResult<usize> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs() as i32;

    diesel::update(image::table.find(image_id))
        .set(image::last_used.eq(Some(now)))
        .execute(conn)
}

pub fn query_read_images(conn: &mut SqliteConnection) -> Vec<Image> {
    image::table
        .load::<Image>(conn)
        .expect("Error reading images")
}

pub fn query_read_recent_images(
    conn: &mut SqliteConnection,
    filter: Option<String>,
) -> Vec<Image> {
    let mut filter_str = filter.unwrap_or("".to_string());
    filter_str.push_str("%");

    image::table
        .filter(image::name.like(filter_str))
        .filter(image::last_used.is_not_null())
        .order(image::last_used.desc())
        .limit(5)
        .load(conn)
        .expect("Error reading recent images")
}

pub fn query_count_images(conn: &mut SqliteConnection, filter: Option<String>) -> i64 {
    let mut filter_str = filter.unwrap_or("".to_string());
    filter_str.push_str("%");
    image::table
        .filter(image::name.like(filter_str))
        .count()
        .get_result(conn)
        .expect("Error counting images")
}

pub fn query_read_images_paginated(
    conn: &mut SqliteConnection,
    page_number: i64,
    entries_per_page: i64,
    filter: Option<String>,
) -> Vec<Image> {
    let mut filter_str = filter.unwrap_or("".to_string());
    filter_str.push_str("%");

    let recent_ids: Vec<i32> = image::table
        .filter(image::name.like(&filter_str))
        .filter(image::last_used.is_not_null())
        .order(image::last_used.desc())
        .limit(5)
        .select(image::id)
        .load(conn)
        .expect("Error reading recent image IDs");

    let mut query = image::table
        .filter(image::name.like(&filter_str))
        .order(image::name.asc())
        .into_boxed();

    for id in &recent_ids {
        query = query.filter(image::id.ne(id));
    }

    query
        .limit(entries_per_page)
        .offset(page_number * entries_per_page)
        .load(conn)
        .expect("Error reading paginated images")
}
