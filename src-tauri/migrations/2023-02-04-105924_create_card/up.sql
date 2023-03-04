-- Your SQL goes here
CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    longitude REAL NOT NULL DEFAULT 0.0,
    latitude REAL NOT NULL DEFAULT 0.0,
    coordinate_radius REAL NOT NULL DEFAULT 0.0
)