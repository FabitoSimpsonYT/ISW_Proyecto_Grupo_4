-- Agregar columna idPauta a la tabla evaluaciones
ALTER TABLE evaluaciones ADD COLUMN "idPauta" INTEGER NULL;

-- Crear índice para mejorar búsquedas
CREATE INDEX idx_evaluaciones_idPauta ON evaluaciones("idPauta");
