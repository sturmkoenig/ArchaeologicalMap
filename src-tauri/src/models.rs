use crate::schema::cards;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Insertable, Deserialize)]
#[diesel(table_name = cards)]
pub struct NewCard<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub category: &'a str,
    pub longitude: f32,
    pub latitude: f32,
    pub coordinate_radius: f32,
}

#[derive(Queryable, Serialize, Clone)]
pub struct Card {
    pub id: i32,
    pub title: String,
    pub category: String,
    pub description: String,
    pub longitude: f32,
    pub latitude: f32,
    pub coordinate_radius: f32,
}
