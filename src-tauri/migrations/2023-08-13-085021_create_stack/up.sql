-- Your SQL goes here
CREATE TABLE stack (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    icon_url VARCHAR NOT NULL
);

CREATE table stack_entry (
    id INTEGER NOT NULL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    stack_id INTEGER NOT NULL,
    FOREIGN KEY(card_id) REFERENCES cards(id),
    FOREIGN KEY(stack_ID) REFERENCES stack(id)
);



