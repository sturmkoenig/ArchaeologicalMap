-- This file should undo anything in `up.sql`
ALTER TABLE cards
ADD COLUMN coordinate_radius REAL NOT NULL DEFAULT 0.0;

ALTER TABLE cards
ADD COLUMN latitude REAL NOT NULL DEFAULT 0.0;

ALTER TABLE cards
ADD COLUMN longitude REAL NOT NULL DEFAULT 0.0;

ALTER TABLE cards
ADD COLUMN category VARCHAR NOT NULL DEFAULT "";

ALTER TABLE cards
ADD COLUMN icon_name VARCHAR NOT NULL DEFAULT "iconDefault";

-- UPDATE cards SET 
-- cards.icon_name = m.icon_name
-- cards.longitude = m.longitude
-- cards.latitude = m.latitude
-- cards.coordinate_radius = m.radius
-- FROM cards JOIN markers on cards.id = markers.card_id