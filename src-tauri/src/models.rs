use crate::schema::{cards, image, marker, stack, card_new};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use crate::schema::cards::region_image_id;

#[derive(Serialize, Deserialize, Debug)]
pub struct CardinalDirections {
    pub north: f32,
    pub east: f32,
    pub south: f32,
    pub west: f32
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CardDTO {
    pub id: Option<i32>,
    pub title: String,
    pub description: String,
    pub markers: Vec<MarkerDTO>,
    pub stack_id: Option<i32>,
    pub region_image_id: Option<i32>,
}
#[derive(Serialize, Deserialize, Debug, Default, Clone, PartialEq)]
pub struct CardUnifiedDTO {
    pub id: Option<i32>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: f32,
    pub latitude: f32,
    pub radius: Option<f32>,
    pub icon_name: String,
    pub stack_id: Option<i32>,
    pub region_image_id: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct MarkerDTO {
    pub id: Option<i32>,
    pub card_id: Option<i32>,
    pub longitude: f32,
    pub radius: f32,
    pub latitude: f32,
    pub icon_name: String,
}
#[derive(Serialize, Debug, AsChangeset)]
#[table_name = "image"]
pub struct ImageDTO {
    pub id: i32,
    pub name: String,
    pub image_source: Option<String>,
}


#[derive(Insertable)]
#[diesel(table_name = card_new)]
pub struct NewUnifiedCard<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub longitude: f32,
    pub latitude: f32,
    pub radius: f32,
    pub icon_name: &'a str,
}
impl Default for NewUnifiedCard<'_> {
    fn default() -> Self {
        NewUnifiedCard {
            title: "",
            description: "",
            longitude: 0.0,
            latitude: 0.0,
            radius: 0.0,
            icon_name: "",
        }
    }
}

#[derive(Insertable)]
#[diesel(table_name = cards)]
pub struct NewCard<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub stack_id: Option<i32>,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = image)]
pub struct NewImage<'a> {
    pub name: &'a str,
    pub image_source: Option<&'a str>,
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

#[derive(Queryable, Debug, Identifiable)]
#[diesel(table_name = image)]
pub struct Image {
    pub id: i32,
    pub name: String,
    pub image_source: String,
}

#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
pub struct Card {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub stack_id: Option<i32>,
    pub region_image_id: Option<i32>,
}

#[derive(Identifiable,Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
#[diesel(table_name = card_new)]
pub struct CardUnified {
    pub id:  i32,
    pub title:  String,
    pub description:  String,
    pub stack_id:  Option<i32>,
    pub latitude:  f32,
    pub longitude:  f32,
    pub radius:  f32,
    pub icon_name:  String,
}

#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
#[diesel(table_name = stack)]
pub struct Stack {
    pub id: i32,
    pub name: String,
    pub image_name: String,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = stack)]
pub struct NewStack {
    pub name: String,
    pub image_name: String,
}

#[derive(Queryable, Serialize, Clone, Debug, Deserialize)]
pub struct StackDTO {
    pub id: Option<i32>,
    pub name: String,
    pub image_name: String,
}

impl From<Stack> for StackDTO {
    fn from(s: Stack) -> Self {
        Self {
            id: Some(s.id),
            name: s.name,
            image_name: s.image_name,
        }
    }
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
            stack_id: c.stack_id,
            region_image_id: c.region_image_id,
        }
    }
}
impl From<CardUnified> for CardUnifiedDTO {
    fn from(c: CardUnified) -> Self {
        Self {
            id: Some(c.id),
            title: Some(c.title),
            description: Some(c.description),
            longitude: c.longitude,
            latitude: c.latitude,
            radius: Some(c.radius),
            icon_name: c.icon_name,
            stack_id: c.stack_id,
            region_image_id: None
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
