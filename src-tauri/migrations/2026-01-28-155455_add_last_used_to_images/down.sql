DROP INDEX IF EXISTS idx_image_last_used;

CREATE TABLE image_new (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL DEFAULT '',
    image_source VARCHAR NOT NULL DEFAULT ''
);

INSERT INTO image_new (id, name, image_source)
SELECT id, name, image_source FROM image;

DROP TABLE image;
ALTER TABLE image_new RENAME TO image;
