-- Crear tabla para almacenar promedio final por alumno y ramo
CREATE TABLE IF NOT EXISTS alumno_promedio_ramo (
  id SERIAL PRIMARY KEY,
  alumno_rut VARCHAR(20) NOT NULL,
  ramo_id INT NOT NULL,
  promedio_final FLOAT,
  promedio_oficial DECIMAL(3,1),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'reprobado'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (alumno_rut, ramo_id),
  FOREIGN KEY (ramo_id) REFERENCES ramos(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_rut) REFERENCES "user"(rut) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alumno_promedio_ramo_rut ON alumno_promedio_ramo(alumno_rut);
CREATE INDEX IF NOT EXISTS idx_alumno_promedio_ramo_ramo ON alumno_promedio_ramo(ramo_id);
CREATE INDEX IF NOT EXISTS idx_alumno_promedio_ramo_estado ON alumno_promedio_ramo(estado);
