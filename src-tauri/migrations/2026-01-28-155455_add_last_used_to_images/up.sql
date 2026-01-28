ALTER TABLE image ADD COLUMN last_used INTEGER NULL;
CREATE INDEX idx_image_last_used ON image(last_used DESC);
