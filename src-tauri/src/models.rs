use crate::schema::{cards, marker};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct CardDTO {
    pub id: Option<i32>,
    pub title: String,
    pub description: String,
    pub markers: Vec<MarkerDTO>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct MarkerDTO {
    pub id: Option<i32>,
    pub card_id: Option<i32>,
    pub longitude: f32,
    pub radius: f32,
    pub latitude: f32,
    pub icon_name: String,
}
#[derive(Insertable)]
#[diesel(table_name = cards)]
pub struct NewCard<'a> {
    pub title: &'a str,
    pub description: &'a str,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = marker)]
pub struct NewMarker<'a> {
    pub card_id: i32,
    pub latitude: f32,
    pub longitude: f32,
    pub radius: f32,
    pub icon_name: &'a str,
}

impl std::fmt::Display for NewCard<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "(titel: {}, description: {})",
            self.title, self.description
        )
    }
}

#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
pub struct Card {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub catalogue_id: i32,
}

#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
#[diesel(table_name = marker)]
pub struct Marker {
    pub id: i32,
    pub card_id: i32,
    pub latitude: f32,
    pub longitude: f32,
    pub radius: f32,
    pub icon_name: String,
}

impl From<Card> for CardDTO {
    fn from(c: Card) -> Self {
        Self {
            id: Some(c.id),
            title: c.title,
            description: c.description,
            markers: Vec::new(),
        }
    }
}

impl From<Marker> for MarkerDTO {
    fn from(m: Marker) -> Self {
        Self {
            id: Some(m.id),
            card_id: Some(m.card_id),
            latitude: m.latitude,
            longitude: m.longitude,
            radius: m.radius,
            icon_name: m.icon_name,
        }
    }
}
#[derive(Serialize)]
pub struct CardTitleMapping {
    pub id: i32,
    pub title: String,
}
