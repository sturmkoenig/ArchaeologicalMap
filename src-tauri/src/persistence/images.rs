use crate::diesel::RunQueryDsl;
use app::{
    models::{Image, ImageDTO, NewImage},
    schema::image,
};
use diesel::expression_methods::ExpressionMethods;
use diesel::{select, sql_function, QueryDsl, TextExpressionMethods};
use diesel::{sql_query, SqliteConnection};

sql_function!(fn last_insert_rowid() -> Integer);

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
pub fn query_update_image(conn: &mut SqliteConnection, image_dto: &ImageDTO) {
    diesel::update(image::table.find(image_dto.id))
        .set(image_dto)
        .execute(conn)
        .expect("Error updating image");
}

pub fn query_update_image_name(conn: &mut SqliteConnection, image_id: i32, new_name: String) {
    diesel::update(image::table.find(image_id))
        .set(image::name.eq(new_name))
        .execute(conn)
        .expect("Error updating image name");
}

pub fn query_read_images(conn: &mut SqliteConnection) -> Vec<Image> {
    image::table
        .load::<Image>(conn)
        .expect("Error reading images")
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
    image::table
        .filter(image::name.like(filter_str))
        .limit(entries_per_page)
        .offset((page_number) * entries_per_page)
        .load::<Image>(conn)
        .expect("Error reading images")
}
