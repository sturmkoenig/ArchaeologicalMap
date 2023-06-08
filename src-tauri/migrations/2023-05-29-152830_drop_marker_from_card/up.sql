-- Your SQL goes here
ALTER TABLE cards 
DROP COLUMN coordinate_radius;

ALTER TABLE cards
DROP COLUMN latitude;

ALTER TABLE cards
DROP COLUMN longitude;

ALTER TABLE cards
DROP COLUMN category;

ALTER TABLE cards
DROP COLUMN icon_name;