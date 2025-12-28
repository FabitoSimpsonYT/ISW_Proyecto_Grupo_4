-- Crear tabla evaluacion_integradora
CREATE TABLE evaluacion_integradora (
  id SERIAL PRIMARY KEY,
  ramo_id INT NOT NULL,
  codigo_ramo VARCHAR(50),
  titulo VARCHAR(255),
  fecha_programada TIMESTAMP,
  hora_inicio TIME,
  hora_fin TIME,
  puntaje_total INT NOT NULL,
  ponderacion FLOAT DEFAULT 40,
  contenidos TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  pauta_publicada BOOLEAN DEFAULT false,
  aplicada BOOLEAN DEFAULT false,
  id_pauta INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ramo_id) REFERENCES ramos(id),
  UNIQUE (ramo_id)
);

-- Crear tabla pauta_evaluada_integradora
CREATE TABLE pauta_evaluada_integradora (
  id SERIAL PRIMARY KEY,
  evaluacion_integradora_id INT NOT NULL,
  alumno_rut VARCHAR(20) NOT NULL,
  nota_final FLOAT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluacion_integradora_id) REFERENCES evaluacion_integradora(id),
  FOREIGN KEY (alumno_rut) REFERENCES "user"(rut),
  UNIQUE (evaluacion_integradora_id, alumno_rut)
);

-- Crear índices para performance
CREATE INDEX idx_evaluacion_integradora_ramo_id ON evaluacion_integradora(ramo_id);
CREATE INDEX idx_pauta_evaluada_integradora_alumno_rut ON pauta_evaluada_integradora(alumno_rut);
CREATE INDEX idx_pauta_evaluada_integradora_evaluacion_id ON pauta_evaluada_integradora(evaluacion_integradora_id);
