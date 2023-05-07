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
    pub icon_name: &'a str,
}

impl std::fmt::Display for NewCard<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "(titel: {}, description: {}, category: {}, longitude: {}, latitude: {}, radius: {}, icon: {})",
            self.title,
            self.description,
            self.category,
            self.longitude,
            self.latitude,
            self.coordinate_radius,
            self.icon_name
        )
    }
}

#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
pub struct Card {
    pub id: i32,
    pub title: String,
    pub category: String,
    pub description: String,
    pub longitude: f32,
    pub latitude: f32,
    pub coordinate_radius: f32,
    pub icon_name: String,
}
