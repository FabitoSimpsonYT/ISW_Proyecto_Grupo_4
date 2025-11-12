ALTER TABLE events ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

UPDATE events 
SET is_blocked = TRUE, is_available = FALSE 
WHERE evaluation_id IS NOT NULL;

CREATE INDEX idx_events_blocked_times ON events (start_time, end_time) 
WHERE is_blocked = TRUE;