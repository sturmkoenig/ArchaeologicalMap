PRAGMA foreign_keys=off;

CREATE TABLE card_new (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    stack_id INTEGER,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    radius FLOAT NOT NULL,
    icon_name TEXT NOT NULL,
    region_image_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack (id),
    FOREIGN KEY (region_image_id) REFERENCES image (id)
);

INSERT INTO card_new
SELECT 
    id, 
    title, 
    description, 
    stack_id, 
    COALESCE(latitude, 0) as latitude, 
    COALESCE(longitude, 0) as longitude, 
    COALESCE(radius, 0) as radius, 
    COALESCE(icon_name, 'default_icon') as icon_name, 
    region_image_id 
FROM card;

DROP TABLE card;

ALTER TABLE card_new RENAME TO card;

PRAGMA foreign_keys=on;
