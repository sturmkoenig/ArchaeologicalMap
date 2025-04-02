-- Your SQL goes here
CREATE TABLE card_new (
    id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    stack_id INTEGER,
    latitude REAl NOT NULL,
    longitude REAL NOT NULL,
    radius REAL NOT NULL,
    icon_name VARCHAR DEFAULT 'iconDefault' NOT NULL,
    region_image_id INTEGER,
    FOREIGN KEY (stack_id) REFERENCES stack(id),
    FOREIGN KEY (region_image_id) REFERENCES image(id)
);

INSERT INTO card_new
WITH ranked_cards AS (
    SELECT
        m.card_id,
        m.id as marker_id,
        c.description,
        c.stack_id,
        c.region_image_id,
        m.latitude,
        m.longitude,
        m.radius,
        m.icon_name,
        c.title || ' ' ||
        CASE
            WHEN (SELECT COUNT(*) FROM marker mm WHERE mm.card_id = m.card_id) > 1 THEN
                CAST((ROW_NUMBER() OVER (
                    PARTITION BY m.card_id
                    ORDER BY m.id
                    )) AS TEXT)
            ELSE ''
            END as new_title,
        CASE
            WHEN ROW_NUMBER() OVER (PARTITION BY m.card_id ORDER BY m.id) = 1 THEN
                m.card_id
            ELSE
                m.card_id * 100000 + ROW_NUMBER() OVER (PARTITION BY m.card_id ORDER BY m.id)
            END as new_card_id
    FROM marker m
             JOIN cards c ON m.card_id = c.id
)
SELECT
    new_card_id as id, new_title as title, description, stack_id, latitude, longitude, radius, icon_name, region_image_id
FROM ranked_cards;
