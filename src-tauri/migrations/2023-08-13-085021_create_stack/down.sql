-- This file should undo anything in `up.sql`
drop table stack;


ALTER TABLE cards rename to cards_old;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL
);

INSERT INTO cards (id, title, description) SELECT id, title ,description from cards_old;


DROP TABLE cards_old;

