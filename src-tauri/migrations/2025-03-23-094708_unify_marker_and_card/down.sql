-- This file should undo anything in `up.sql`
DROP TABLE card;

ALTER TABLE card_old RENAME TO cards;
