-- Migration: Add slot columns to eventos table
-- Purpose: Add support for slot-based evaluations

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS fecha_rango_inicio DATE;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS fecha_rango_fin DATE;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS hora_inicio_diaria TIME;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS hora_fin_diaria TIME;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS duracion_por_alumno INTEGER;

-- Create index for better query performance on fecha_rango columns
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_rango ON eventos(fecha_rango_inicio, fecha_rango_fin);
