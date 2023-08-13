-- Your SQL goes here
CREATE TABLE catalogue (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    icon_url VARCHAR NOT NULL
);

INSERT INTO catalogue
VALUES (0, "Nicht zugeordnet", "no-icon");

CREATE TABLE cards_copy (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL, catalogue_id INTEGER DEFAULT 0 NOT NULL,
    FOREIGN KEY(catalogue_id) REFERENCES catalogue(id) 
);

INSERT INTO cards_copy
SELECT id, title, description, 0 
FROM cards;

drop table cards;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL, catalogue_id INTEGER DEFAULT 0 NOT NULL,
    FOREIGN KEY(catalogue_id) REFERENCES catalogue(id) 
);

INSERT INTO cards
SELECT *
from cards_copy;

drop table cards_copy;



