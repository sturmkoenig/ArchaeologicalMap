use crate::schema::{card, image, stack};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct CardinalDirections {
    pub north: f32,
    pub east: f32,
    pub south: f32,
    pub west: f32
}

#[derive(Serialize, Deserialize, Debug, Default, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CardDTO {
    pub id: Option<i32>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: Option<f32>,
    pub latitude: Option<f32>,
    pub radius: Option<f32>,
    pub icon_name: Option<String>,
    pub stack_id: Option<i32>,
    pub region_image_id: Option<i32>,
}

#[derive(Serialize, Debug, AsChangeset)]
#[diesel(table_name = image)]
#[serde(rename_all = "camelCase")]
pub struct ImageDTO {
    pub id: i32,
    pub name: String,
    pub image_source: Option<String>,
}


#[derive(Insertable, AsChangeset)]
#[diesel(table_name = card)]
pub struct NewCard<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub longitude: Option<f32>,
    pub latitude: Option<f32>,
    pub radius: Option<f32>,
    pub icon_name: Option<&'a str>,
    pub stack_id: Option<i32>,
    pub region_image_id: Option<i32>
}

impl Default for NewCard<'_> {
    fn default() -> Self {
        NewCard {
            title: "",
            description: "",
            longitude: None,
            latitude: None,
            radius: None,
            icon_name: None,
            stack_id: None,
            region_image_id: None
        }
    }
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = image)]
#[serde(rename_all = "camelCase")]
pub struct NewImage<'a> {
    pub name: &'a str,
    pub image_source: Option<&'a str>,
}


#[derive(Queryable, Debug, Identifiable)]
#[diesel(table_name = image)]
pub struct Image {
    pub id: i32,
    pub name: String,
    pub image_source: String,
}

#[derive(Identifiable,Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
#[diesel(table_name = card)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id:  i32,
    pub title:  String,
    pub description:  String,
    pub stack_id:  Option<i32>,
    pub latitude:  Option<f32>,
    pub longitude:  Option<f32>,
    pub radius:  Option<f32>,
    pub icon_name:  Option<String>,
    pub region_image_id: Option<i32>,
}

#[derive(AsChangeset)]
#[diesel(table_name = card)]
pub struct UpdateCard {
    pub id:  i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: Option<Option<f32>>, // this double Option is KEY
    pub latitude: Option<Option<f32>>,
    pub radius: Option<Option<f32>>,
    pub icon_name: Option<Option<String>>,
    pub stack_id: Option<Option<i32>>,
    pub region_image_id: Option<Option<i32>>,
}


#[derive(Queryable, Serialize, Clone, Debug, AsChangeset, Deserialize)]
#[diesel(table_name = stack)]
#[serde(rename_all = "camelCase")]
pub struct Stack {
    pub id: i32,
    pub name: String,
    pub image_name: String,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = stack)]
#[serde(rename_all = "camelCase")]
pub struct NewStack {
    pub name: String,
    pub image_name: String,
}

#[derive(Queryable, Serialize, Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
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

impl From<Card> for CardDTO {
    fn from(c: Card) -> Self {
        Self {
            id: Some(c.id),
            title: Some(c.title),
            description: Some(c.description),
            longitude: c.longitude,
            latitude: c.latitude,
            radius: c.radius,
            icon_name: c.icon_name,
            stack_id: c.stack_id,
            region_image_id: c.region_image_id
        }
    }
}
