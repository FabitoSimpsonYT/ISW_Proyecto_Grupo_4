-- Agregar columna evaluation_id a la tabla events
ALTER TABLE events ADD COLUMN evaluation_id INTEGER;

-- Agregar clave foránea
ALTER TABLE events ADD CONSTRAINT fk_event_evaluation 
FOREIGN KEY (evaluation_id) REFERENCES evaluaciones(id)
ON DELETE SET NULL;