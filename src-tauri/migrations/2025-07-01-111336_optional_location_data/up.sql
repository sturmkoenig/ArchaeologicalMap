PRAGMA foreign_keys=off;

CREATE TABLE card_new (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    stack_id INTEGER,
    latitude FLOAT,
    longitude FLOAT,
    radius FLOAT,
    icon_name TEXT,
    region_image_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack (id),
    FOREIGN KEY (region_image_id) REFERENCES image (id)
);

INSERT INTO card_new SELECT * FROM card;

DROP TABLE card;

ALTER TABLE card_new RENAME TO card;

PRAGMA foreign_keys=on;
