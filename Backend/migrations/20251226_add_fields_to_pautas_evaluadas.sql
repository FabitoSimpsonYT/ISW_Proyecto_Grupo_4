-- Agregar campos idEvaluacion, codigoRamo e idPauta a la tabla pautas_evaluadas
-- Estos campos se usan para buscar coincidencias rápidas sin necesidad de joins

ALTER TABLE pautas_evaluadas
ADD COLUMN IF NOT EXISTS codigo_ramo VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS id_evaluacion INT NULL,
ADD COLUMN IF NOT EXISTS id_pauta INT NULL;

-- Crear índices para mejorar las búsquedas
CREATE INDEX IF NOT EXISTS idx_pautas_evaluadas_codigo_ramo ON pautas_evaluadas(codigo_ramo);
CREATE INDEX IF NOT EXISTS idx_pautas_evaluadas_id_evaluacion ON pautas_evaluadas(id_evaluacion);
CREATE INDEX IF NOT EXISTS idx_pautas_evaluadas_id_pauta ON pautas_evaluadas(id_pauta);
CREATE INDEX IF NOT EXISTS idx_pautas_evaluadas_alumno_rut_codigo_ramo ON pautas_evaluadas(alumno_rut, codigo_ramo);
