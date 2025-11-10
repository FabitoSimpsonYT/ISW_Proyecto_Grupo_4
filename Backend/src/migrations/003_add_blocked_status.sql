-- Agregar columna is_blocked a la tabla events
ALTER TABLE events ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

-- Actualizar eventos existentes vinculados a evaluaciones
UPDATE events 
SET is_blocked = TRUE, is_available = FALSE 
WHERE evaluation_id IS NOT NULL;

-- Crear índice para mejorar las búsquedas de conflictos
CREATE INDEX idx_events_blocked_times ON events (start_time, end_time) 
WHERE is_blocked = TRUE;