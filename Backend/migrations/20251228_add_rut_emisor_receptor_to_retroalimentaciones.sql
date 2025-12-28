-- Agregar columnas rutEmisor y rutReceptor a retroalimentaciones
ALTER TABLE retroalimentaciones
ADD COLUMN IF NOT EXISTS rut_emisor VARCHAR(12) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS rut_receptor VARCHAR(12) NOT NULL DEFAULT '';

-- Crear índices para estas columnas
CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_rut_emisor_receptor 
ON retroalimentaciones(rut_emisor, rut_receptor);

CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_evaluacion_rut 
ON retroalimentaciones(evaluacion_id, rut_emisor, rut_receptor);

CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_integradora_rut 
ON retroalimentaciones(evaluacion_integradora_id, rut_emisor, rut_receptor);

-- Actualizar registros existentes: si el emisor es profesor, el receptor es alumno y viceversa
UPDATE retroalimentaciones
SET rut_emisor = CASE 
    WHEN u.role = 'profesor' OR u.role = 'jefecarrera' THEN u.rut
    ELSE alumno.rut
END,
rut_receptor = CASE 
    WHEN u.role = 'profesor' OR u.role = 'jefecarrera' THEN alumno.rut
    ELSE u.rut
END
FROM users u
LEFT JOIN alumnos alumno ON u.id = alumno.id
WHERE creado_por = u.id
  AND (rut_emisor = '' OR rut_receptor = '');
