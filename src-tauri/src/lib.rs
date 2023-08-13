use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

use std::path::PathBuf;
use tauri::api::path::data_dir;

diesel::sql_function! (fn last_insert_rowid() -> diesel::sql_types::Integer);

// TODO find a way to set this path using the tauri api
pub fn get_local_dir() -> PathBuf {
    let mut local_dir = data_dir().unwrap().clone();
    local_dir.push(PathBuf::from("de.lla.am"));
    local_dir
}

pub fn get_path_local_dir(path_name: String) -> PathBuf {
    let mut file_path = get_local_dir().clone();
    file_path.push(PathBuf::from(path_name));
    file_path
}

pub mod models;
pub mod schema;

pub fn establish_connection() -> SqliteConnection {
    let connection_path = get_path_local_dir(String::from("am.db"));
    let database_url = connection_path.to_str().unwrap();

    SqliteConnection::establish(database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
