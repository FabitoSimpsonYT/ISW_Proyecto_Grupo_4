-- Agregar campos faltantes a pauta_evaluada_integradora
ALTER TABLE pauta_evaluada_integradora 
ADD COLUMN pauta_id INT NOT NULL DEFAULT 1,
ADD COLUMN puntajes_obtenidos JSON;

-- Agregar relación con la tabla pauta
ALTER TABLE pauta_evaluada_integradora
ADD CONSTRAINT fk_pauta_evaluada_integradora_pauta 
FOREIGN KEY (pauta_id) REFERENCES pauta(id);

-- Crear índice para pauta_id
CREATE INDEX idx_pauta_evaluada_integradora_pauta_id ON pauta_evaluada_integradora(pauta_id);
