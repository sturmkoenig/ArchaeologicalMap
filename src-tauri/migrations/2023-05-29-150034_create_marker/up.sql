-- Your SQL goes here
CREATE TABLE marker (
    id INTEGER NOT NULL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL, 
    radius REAL NOT NULL,
    icon_name VARCHAR DEFAULT "iconDefault" NOT NULL,  
    FOREIGN KEY(card_id) REFERENCES cards(id)
);

INSERT INTO marker
SELECT id, id as card_id, latitude, longitude, coordinate_radius as radius, icon_name 
FROM cards;

