#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
extern crate diesel;
extern crate diesel_migrations;

pub mod persistence;
use app::models::CardUnified;
use app::models::MarkerDTO;
use app::models::NewImage;
use app::models::NewStack;
use app::models::Stack;
use app::models::StackDTO;
use app::models::{CardDTO, CardUnifiedDTO};
use app::models::{CardinalDirections, ImageDTO};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use persistence::cards::query_cards_paginated;
use persistence::cards::query_count_cards;
use persistence::cards::query_delete_card;
use persistence::images::query_create_image;
use persistence::markers::query_delete_all_markers_for_card;
use persistence::markers::query_join_markers;
use persistence::stacks::query_all_stacks;
use persistence::stacks::query_create_stack;
use persistence::stacks::query_delete_stack;
use persistence::stacks::query_update_stack;
use tauri_api::path::app_dir;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

use crate::persistence::images::query_update_image;
use crate::persistence::stacks::query_stack_by_id;
use crate::persistence::unified_cards::{query_cards_in_geological_area, query_create_unified_card, query_set_image_to_null, query_unified_card_by_id, query_unified_cards_in_stack, query_update_unified_card};
use app::establish_connection;
use std::env;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

// main.rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            read_cards_paginated,
            count_cards,
            write_card_content,
            read_card_content,
            delete_card,

            read_cards_in_area,
            read_cards_in_stack,
            read_card_by_id,
            update_card_unified,
            create_unified_card,

            create_stack,
            update_stack,
            delete_stack,
            read_all_stacks,

            create_image,
            read_image,
            read_images,
            read_images_paginated,
            update_image_name,
            delete_image,
        ])
        .setup(|_app| {
            let data_path = app_dir().unwrap();
            if !data_path.exists() {
                fs::create_dir_all(data_path)?;
            }

            let conn = &mut establish_connection();
            // TODO handle error
            let err = conn.run_pending_migrations(MIGRATIONS);

            if let Err(e) = err {
                println!("Error running migrations: {:?}", e);
            }

            let app_dir = app_dir().expect("error creating app data dir");
            let err = fs::create_dir(&app_dir);
            if let Err(e) = err {
                println!("Error creating app dir: {:?}", e);
            }

            let mut content_dir = app_dir.clone();
            content_dir.push("content");
            let mut images_dir = content_dir.clone();
            images_dir.push("images");
            let err = fs::create_dir(content_dir);
            if let Err(e) = err {
                println!("Error creating content dir: {:?}", e);
            }
            let err = fs::create_dir(images_dir);
            if let Err(e) = err {
                println!("Error creating images dir: {:?}", e);
            }

            let cache_dir = app_dir.clone();

            let err = fs::create_dir(cache_dir);
            if let Err(e) = err {
                println!("Error creating cache dir: {:?}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn read_cards_paginated(page: i64, filter: String) -> Vec<CardDTO> {
    let conn = &mut establish_connection();
    let cards = query_cards_paginated(conn, page, filter);
    let mut card_dtos: Vec<CardDTO> = Vec::new();

    for card in cards.iter() {
        let markers_for_card = query_join_markers(conn, card.id);
        let mut markers: Vec<MarkerDTO> = Vec::new();
        for marker in markers_for_card.iter() {
            markers.push(MarkerDTO {
                id: Some(marker.id),
                card_id: Some(card.id),
                longitude: marker.longitude,
                radius: marker.radius,
                latitude: marker.latitude,
                icon_name: marker.icon_name.clone(),
            });
        }
        card_dtos.push(CardDTO {
            id: Some(card.id),
            title: card.title.clone(),
            description: card.description.clone(),
            markers,
            stack_id: card.stack_id,
            region_image_id: card.region_image_id,
        })
    }
    card_dtos
}

#[tauri::command]
fn read_cards_in_area(cardinal_directions: CardinalDirections) -> Result<Vec<CardUnifiedDTO>, String> {
    let conn = &mut establish_connection();

    query_cards_in_geological_area(conn, cardinal_directions).map(|res|
        res.into_iter().map(CardUnifiedDTO::from).collect::<Vec<CardUnifiedDTO>>()).map_err(|err| err.to_string())
}

#[tauri::command]
fn update_card_unified(card: CardUnifiedDTO) -> Result<bool, String> {
    let conn = &mut establish_connection();
    let id = card.id.ok_or("id is missing".to_string())?;

    query_update_unified_card(
        conn,
        CardUnified {
            id,
            title: card.title.unwrap_or("".to_string()),
            description: card.description.unwrap_or("".to_string()),
            stack_id: card.stack_id,
            latitude: card.latitude,
            longitude: card.longitude,
            radius: card.radius.unwrap_or(0.0),
            icon_name: card.icon_name,
            region_image_id: card.region_image_id,
        },
    ).map_err(|err| err.to_string())
}

#[tauri::command]
fn read_card_by_id(id: i32) -> Result<CardUnifiedDTO, String> {
    let conn = &mut establish_connection();
    query_unified_card_by_id(conn, id).map_err(|err| err.to_string())
}

#[tauri::command]
fn create_unified_card(card: CardUnifiedDTO) -> Result<CardUnifiedDTO, String> {
    let conn = &mut establish_connection();
    query_create_unified_card(conn, card).map(CardUnifiedDTO::from).map_err(|err| err.to_string())
}

// TODO may be moved to frontend
#[tauri::command]
async fn read_card_content(app_handle: tauri::AppHandle, id: String) -> Option<String> {
    let mut app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("error getting app dir");
    app_dir.push(format!("content/{}.json", id));
    let content = fs::read_to_string(app_dir);
    match content {
        Ok(content) => return Some(content),
        Err(_e) => return None,
    }
}

#[tauri::command]
fn write_card_content(app_handle: tauri::AppHandle, id: String, content: String) {
    let mut content_dir = app_handle
        .path()
        .app_data_dir()
        .expect("error getting data dir");
    content_dir.push(format!("content/{}.json", id));
    fs::write(content_dir, content).expect("error opening file");
}


#[tauri::command]
fn count_cards() -> i64 {
    let conn = &mut establish_connection();
    query_count_cards(conn)
}

#[tauri::command]
fn delete_card(id: i32) {
    let conn = &mut establish_connection();
    query_delete_all_markers_for_card(conn, id);
    let _ = query_delete_card(conn, id);
}


#[tauri::command]
fn read_all_stacks() -> Vec<StackDTO> {
    let conn = &mut establish_connection();
    let stacks = query_all_stacks(conn);
    let mut stack_dtos: Vec<StackDTO> = Vec::new();
    for stack in stacks.iter() {
        stack_dtos.push(StackDTO::from(stack.clone()))
    }
    stack_dtos
}

#[tauri::command]
fn read_cards_in_stack(stack_id: i32) ->  Result<(StackDTO, Vec<CardUnifiedDTO>), String>{
    println!("stack_id: {}", stack_id);
    let conn = &mut establish_connection();
    let cards = query_unified_cards_in_stack(conn, stack_id).map(|cards| cards.into_iter().map(CardUnifiedDTO::from).collect()).map_err(|err| err.to_string())?;
    let stack = query_stack_by_id(conn, stack_id);
    Ok((StackDTO::from(stack), cards))
}

#[tauri::command]
fn create_stack(stack: NewStack) -> Stack {
    let conn = &mut establish_connection();
    query_create_stack(conn, &stack)
}

#[tauri::command]
fn update_stack(updated_stack: Stack) -> Stack {
    let conn = &mut establish_connection();
    query_update_stack(conn, &updated_stack)
}

#[tauri::command]
fn delete_stack(stack_id: i32) -> Option<bool> {
    let conn = &mut establish_connection();
    query_delete_stack(conn, stack_id);
    Some(true)
}

#[tauri::command]
fn create_image(
    app_handle: AppHandle,
    image_path: String,
    image_name: String,
) -> Result<i32, String> {
    let conn = &mut establish_connection();
    let new_image: NewImage = NewImage {
        name: &image_name,
        image_source: std::option::Option::None,
    };
    let image_id = query_create_image(conn, &new_image);
    let app_data_dir = app_handle.path().app_data_dir().expect("couldn't get app data dir");

    let file_stem = Path::new(&image_path)
        .file_stem()
        .and_then(|fname| fname.to_str()).expect("Panic! No such filename ");


    let extension = Path::new(&image_path)
        .extension()
        .and_then(|fname| fname.to_str())
        .ok_or_else(|| "Invalid image extension")?;

    let new_image_name = format!("{}_{}.{}", image_id, file_stem, extension);
    let app_image_dir = "content/images/";
    let dest_path = app_data_dir.join(format!("{}{}", app_image_dir, new_image_name));
    let _ = fs::copy(image_path, dest_path).or_else(|e| {
        println!("Error copying image: {:?}", e);
        return Err(e);
    }).expect("couldn't copy image");
    let image_source = Some(format!("{}{}", app_image_dir, new_image_name));
    let image_dto = ImageDTO {
        id: image_id,
        name: image_name,
        image_source,
    };
    query_update_image(conn, &image_dto);
    Ok(image_id)
}

#[tauri::command]
fn read_image(image_id: i32) -> ImageDTO {
    let conn = &mut establish_connection();
    let image = persistence::images::query_read_image(conn, image_id);

    ImageDTO {
        id: image.id,
        name: image.name,
        image_source: Some(image.image_source),
    }
}

#[tauri::command]
fn delete_image(app_handle: AppHandle, image_name: &str, image_id: i32) -> Result<(), String> {
    let conn = &mut establish_connection();
    let image = persistence::images::query_read_image(conn, image_id);
    query_set_image_to_null(conn, image_id).map_err(|err| err.to_string())?;
    persistence::images::query_delete_image(conn, image_id)?;
    let delete_path = app_handle
        .path()
        .app_data_dir()
        .expect("error getting app data dir")
        .join(image.image_source);
    match fs::remove_file(delete_path.clone()) {
        Ok(_) => println!("Image (id: {image_id}, name: {image_name}) deleted"),
        Err(e) => {
            println!(
                "Error deleting image (id: {image_id}, name: {image_name}, path: {:?}): {:?}",
                delete_path, e
            );
            return Err(e.to_string());
        }
    };
    Ok(())
}

#[tauri::command]
fn read_images() -> Vec<ImageDTO> {
    let conn = &mut establish_connection();
    let images = persistence::images::query_read_images(conn);
    let mut image_dtos: Vec<ImageDTO> = Vec::new();
    for image in images.iter() {
        image_dtos.push(ImageDTO {
            id: image.id,
            name: image.name.clone(),
            image_source: Some(image.image_source.clone()),
        });
    }
    image_dtos
}

#[tauri::command]
fn read_images_paginated(
    entries_per_page: i64,
    page_number: i64,
    title_filter: Option<String>,
) -> (Vec<ImageDTO>, i64) {
    let conn = &mut establish_connection();
    let images = persistence::images::query_read_images_paginated(
        conn,
        page_number,
        entries_per_page,
        title_filter.clone(),
    );
    let mut image_dtos: Vec<ImageDTO> = Vec::new();
    for image in images.iter() {
        image_dtos.push(ImageDTO {
            id: image.id,
            name: image.name.clone(),
            image_source: Some(image.image_source.clone()),
        });
    }
    let number_of_images = persistence::images::query_count_images(conn, title_filter.clone());
    (image_dtos, number_of_images)
}
#[tauri::command]
fn update_image_name(image_id: i32, new_name: String) {
    let conn = &mut establish_connection();
    persistence::images::query_update_image_name(conn, image_id, new_name);
}

#[cfg(test)]
mod tests {
    use crate::{create_stack, create_unified_card, read_card_by_id, read_cards_in_area, read_cards_in_stack, update_card_unified, MIGRATIONS};
    use app::establish_connection;
    use app::models::{CardUnifiedDTO, CardinalDirections, NewStack};
    use diesel_migrations::MigrationHarness;
    use serial_test::serial;
    use std::default::Default;
    use std::env;
    use std::fs;

    fn given_test_card() -> CardUnifiedDTO {
        CardUnifiedDTO{
            id: None,
            title: Some("My Title".to_string()),
            description: Some("My Description".to_string()),
            longitude:  2.690451,
            latitude: 48.405937,
            radius: Some(25.0),
            icon_name: "IconMiscRed".to_string(),
            ..Default::default()
        }
    }
    fn given_new_stack() -> NewStack {
       NewStack {
            name: "My French Stack".to_string(),
            image_name: "french-flag.png".to_string()
        }
    }


    struct TestDb {
       name: String
    }
    impl TestDb {
        fn initialize() -> Self {
            let db_name = "testing.db".to_string();
            println!("unique name: {}", db_name.clone() );
            env::set_var("DB_PATH", db_name.clone());
            let conn = &mut establish_connection();
            conn.run_pending_migrations(MIGRATIONS).expect("Error running migrations");
            Self {
                name: db_name
            }
        }

    }
    impl Drop for TestDb {
        fn drop(&mut self) {
            let conn = &mut establish_connection();
            conn.revert_all_migrations(MIGRATIONS).expect("Failed to revert migrations");
            fs::remove_file(&self.name).expect("Failed to remove test database file");
        }
    }

    fn given_database_has_card(card: CardUnifiedDTO) -> CardUnifiedDTO{
        create_unified_card(card.clone()).expect(&format!("Error creating card {:?}", card))
    }
    fn initialize_test_env() -> TestDb{
        TestDb::initialize()
    }

    fn given_a_stack(stack: Option<NewStack>) -> i32 {
        match stack {
            Some(stack) => create_stack(stack).id,
            None => create_stack(given_new_stack()).id
        }
    }
    #[test]
    #[serial]
    fn it_creates_a_card_with_all_properties_when_a_create_unified_card_command_is_received(){
        let _test_env = initialize_test_env();
        let titel = "a card".to_string();
        let description = "a description".to_string();
        let unified_card = CardUnifiedDTO {
            title: Some(titel.clone()),
            description: Some(description.clone()),
            longitude: 52.0,
            latitude: 9.0,
            stack_id: Some(1),
            region_image_id: Some(1),
            icon_name: "icon_default".to_string(),
            ..CardUnifiedDTO::default()
        };

        let created_card = create_unified_card(unified_card).expect("failed to create card!");
        assert_ne!(created_card.id, None);
        assert_eq!(created_card.title.unwrap(), titel);
        assert_eq!(created_card.region_image_id.unwrap(), 1);
        assert_eq!(created_card.stack_id.unwrap(), 1);
        assert_eq!(created_card.description.unwrap(), description);
        assert_eq!(created_card.longitude, 52.0);
        assert_eq!(created_card.latitude, 9.0);
        assert_eq!(created_card.icon_name, "icon_default");
    }
    #[test]
    #[serial]
    fn it_is_able_to_query_card_by_using_geo_boundaries(){
        let _test_env = initialize_test_env();
        let want_title = String::from("My wanted Card");
        given_database_has_card(CardUnifiedDTO::default());
        given_database_has_card(CardUnifiedDTO { title: Some(want_title.clone()), longitude: 10., latitude: 10., ..Default::default()});
        let result = read_cards_in_area(CardinalDirections{north:11.0, east:11.0, south: 9., west:9.}).expect("could not read cards in area!");
        assert_eq!(result.iter().len(), 1);
        let card = result.get(0).expect("No card found in the result");
        let got_title = card.title.as_ref().expect("No card title in the result");
        assert_eq!(got_title, &want_title);
    }
    #[test]
    #[serial]
    fn it_is_able_to_query_a_card_by_using_its_id(){
        let _test_env = initialize_test_env();
        let want_card = given_test_card().clone();
        let card_id = given_database_has_card(want_card.clone()).id.expect("id is empty");
        let got_card = read_card_by_id(card_id).expect(&format!("Could not read card with id {}", card_id));
        assert_eq!(got_card, CardUnifiedDTO{id: Some(card_id),..want_card});
    }
    #[test]
    #[serial]
    fn it_should_exit_gracefully_when_id_was_not_found(){
        let _test_env = initialize_test_env();
        let got_card = read_card_by_id(1);
        assert!(got_card.is_err());
        assert_eq!(got_card.unwrap_err(), "Record not found");
    }

    #[test]
    #[serial]
    fn it_should_update_a_card(){
        let _test_env = initialize_test_env();
        let want_card = given_test_card().clone();
        let card_id = given_database_has_card(want_card.clone()).id.expect("id is empty");
        let update_card = CardUnifiedDTO {
            id: Some(card_id),
            title: Some("My new Title".to_string()),
            description: Some("a updated description, including more depth and details".to_string()),
            longitude: 1.337,
            latitude: -1.5,
            radius: Some(99.9),
            icon_name: "iconLimesSpecial".to_string(),
            ..want_card
        };
        let update_result =update_card_unified(update_card.clone()).expect("update failed!");
        assert!(update_result);
        let got_card = read_card_by_id(card_id).expect("card not found");
        assert_eq!(got_card, update_card);
    }

    #[test]
    #[serial]
    fn it_should_retrieve_all_cards_in_a_stack(){
        let _test_env = initialize_test_env();
        let stack_id = given_a_stack(None);
        let number_of_cards_in_stack = 2;
        given_database_has_card(CardUnifiedDTO{ stack_id: Some(stack_id), ..given_test_card().clone()});
        given_database_has_card(CardUnifiedDTO{ stack_id: Some(stack_id), ..given_test_card().clone()});
        given_database_has_card(CardUnifiedDTO{ stack_id: Some(stack_id+1), ..given_test_card().clone()});
        let (stack, got_cards_in_stack) = read_cards_in_stack(stack_id).expect("Error reading cards in stack");
        assert_eq!(got_cards_in_stack.iter().len(), number_of_cards_in_stack);
    }
}
