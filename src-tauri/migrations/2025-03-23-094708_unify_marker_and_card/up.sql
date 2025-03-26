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
    FOREIGN KEY (stack_id) REFERENCES stack(id)
);

INSERT INTO card_new
WITH ranked_cards AS (
    SELECT
        m.card_id,
        m.id as marker_id,
        c.description,
        c.stack_id,
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
        END as new_title
    FROM marker m
    JOIN cards c ON m.card_id = c.id
)
SELECT
marker_id as id, new_title as title, description, stack_id, latitude, longitude, radius, icon_name
FROM ranked_cards;
