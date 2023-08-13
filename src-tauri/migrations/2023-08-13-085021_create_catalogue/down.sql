-- This file should undo anything in `up.sql`
DROP TABLE catalogue;


ALTER TABLE cards RENAME TO _cards_old;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL
);

INSERT INTO cards
SELECT id, title, description
FROM _cards_old;

drop table _cards_old;