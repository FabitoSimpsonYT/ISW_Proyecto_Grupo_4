-- Agregar columnas promedioParcial y notaIntegradora a la tabla alumno_promedio_ramo
ALTER TABLE alumno_promedio_ramo 
ADD COLUMN IF NOT EXISTS "promedioParcial" FLOAT NULL COMMENT 'Promedio sin contar evaluación integradora',
ADD COLUMN IF NOT EXISTS "notaIntegradora" FLOAT NULL COMMENT 'Nota de la evaluación integradora';

-- Crear índices para búsquedas futuras
CREATE INDEX IF NOT EXISTS idx_alumno_promedio_ramo_promedioParcial ON alumno_promedio_ramo("promedioParcial");
