-- 20251228_create_retroalimentaciones_table.sql

CREATE TABLE IF NOT EXISTS retroalimentaciones (
  id SERIAL PRIMARY KEY,
  evaluacion_id INT REFERENCES evaluaciones(id) ON DELETE SET NULL,
  evaluacion_integradora_id INT REFERENCES evaluacion_integradora(id) ON DELETE SET NULL,
  profesor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alumno_rut VARCHAR(12) NOT NULL,
  ramo_id INT NOT NULL REFERENCES ramos(id) ON DELETE CASCADE,
  codigo_ramo VARCHAR(20),
  mensaje TEXT NOT NULL,
  visto BOOLEAN DEFAULT FALSE,
  creado_por INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_retroalimentacion_ramo FOREIGN KEY (ramo_id) REFERENCES ramos(id) ON DELETE CASCADE
);

-- Índices para mejorar queries
CREATE INDEX idx_retroalimentacion_evaluacion_profesor_alumno 
  ON retroalimentaciones(evaluacion_id, profesor_id, alumno_rut);

CREATE INDEX idx_retroalimentacion_evaluacion_integradora_profesor_alumno 
  ON retroalimentaciones(evaluacion_integradora_id, profesor_id, alumno_rut);

CREATE INDEX idx_retroalimentacion_ramo_visto 
  ON retroalimentaciones(ramo_id, visto);

CREATE INDEX idx_retroalimentacion_alumno_rut 
  ON retroalimentaciones(alumno_rut);

CREATE INDEX idx_retroalimentacion_profesor 
  ON retroalimentaciones(profesor_id);

CREATE INDEX idx_retroalimentacion_created_at 
  ON retroalimentaciones(created_at);
