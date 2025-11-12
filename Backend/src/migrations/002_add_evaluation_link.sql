ALTER TABLE events ADD COLUMN evaluation_id INTEGER;

ALTER TABLE events ADD CONSTRAINT fk_event_evaluation 
FOREIGN KEY (evaluation_id) REFERENCES evaluaciones(id)
ON DELETE SET NULL;