-- Migration: Add horaInicio, horaFin columns to evaluaciones table
-- Date: 2025-11-10
-- Description: Separates time fields from fechaProgramada
--              fechaProgramada: DATE (YYYY-MM-DD) - stores only the date
--              horaInicio: TIME (HH:mm) - start time
--              horaFin: TIME (HH:mm) - end time

BEGIN;

-- Add new columns if they don't exist
ALTER TABLE evaluaciones
ADD COLUMN IF NOT EXISTS horaInicio TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS horaFin TIME DEFAULT NULL;

-- Convert fechaProgramada from timestamp to date (keep only the date part)
-- First, create a temporary column
ALTER TABLE evaluaciones
ADD COLUMN IF NOT EXISTS fechaProgramada_temp DATE DEFAULT NULL;

-- Copy the date portion from the old fechaProgramada to the temp column
UPDATE evaluaciones
SET fechaProgramada_temp = DATE(fechaProgramada)
WHERE fechaProgramada IS NOT NULL;

-- Drop the old fechaProgramada column and rename temp
ALTER TABLE evaluaciones DROP COLUMN IF EXISTS fechaProgramada CASCADE;
ALTER TABLE evaluaciones RENAME COLUMN fechaProgramada_temp TO fechaProgramada;

-- Create a unique index on (horaInicio) to prevent multiple evaluations at the same hour:minute
-- This ensures no two evaluations can be created at the same time, regardless of date or ramo
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluaciones_horaInicio 
ON evaluaciones (horaInicio) 
WHERE horaInicio IS NOT NULL;

COMMIT;

-- Instructions to run this migration:
-- psql -U [username] -d [database_name] -f Backend/migrations/20251110_add_fecha_hora_columns.sql
--
-- Or connect to psql and run:
-- \i Backend/migrations/20251110_add_fecha_hora_columns.sql
--
-- To check if the migration was applied:
-- \d evaluaciones
-- Should show: 
--   fechaProgramada (DATE), 
--   horaInicio (TIME), 
--   horaFin (TIME)

