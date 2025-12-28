-- Agregar columna evaluacionIntegradoraId a la tabla pautas
ALTER TABLE pautas
ADD COLUMN evaluacionIntegradoraId INT NULL;

-- Crear índice para la nueva columna
CREATE INDEX idx_pautas_evaluacionIntegradoraId ON pautas(evaluacionIntegradoraId);
