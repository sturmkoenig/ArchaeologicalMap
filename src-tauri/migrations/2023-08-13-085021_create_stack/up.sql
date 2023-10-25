-- Your SQL goes here
CREATE TABLE stack (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    image_name VARCHAR NOT NULL
);

ALTER TABLE cards RENAME TO cards_old;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    stack_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack(id)
);

INSERT INTO cards (id, title, description, stack_id ) SELECT id, title ,description, NULL from cards_old;


DROP TABLE cards_old;
