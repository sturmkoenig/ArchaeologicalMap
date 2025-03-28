use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use std::env;

use std::path::PathBuf;
use tauri_api::path::data_dir;

diesel::define_sql_function! (fn last_insert_rowid() -> diesel::sql_types::Integer);

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
    let connection_path;
    match env::var("DB_PATH") {
        Ok(s) => connection_path = PathBuf::from(s),
        _ => connection_path = get_path_local_dir("am.db".to_string())
    }
    let database_url = connection_path.to_str().unwrap();

    SqliteConnection::establish(database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
