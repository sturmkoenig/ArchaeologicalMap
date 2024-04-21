-- This file should undo anything in `up.sql`


ALTER TABLE cards rename to cards_old;

CREATE TABLE cards (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    stack_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack(id)
);

INSERT INTO cards (id, title, description, stack_id ) SELECT id, title ,description, stack_id from cards_old;

DROP TABLE image;
DROP TABLE cards_old;
