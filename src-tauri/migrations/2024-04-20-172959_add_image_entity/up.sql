-- Your SQL goes here

CREATE TABLE image (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description VARCHAR,
    image_source BLOB NOT NULL
);

ALTER TABLE cards RENAME TO cards_old;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    stack_id INTEGER,
    region_image_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack(id),
    FOREIGN KEY (region_image_id) REFERENCES image(id)
);

INSERT INTO cards (id, title, description, stack_id, region_image_id) SELECT id, title ,description, stack_id, NULL from cards_old;
DROP TABLE cards_old;
