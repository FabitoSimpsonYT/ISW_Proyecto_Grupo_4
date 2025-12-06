-- Migration: 20251110_convert_fechaProgramada_to_timestamp.sql
-- Propósito: convertir la columna `fechaProgramada` de DATE a TIMESTAMP y añadir una
-- restricción/índice único que impida dos evaluaciones a la misma HORA:MINUTO (independiente del día o ramo).
-- IMPORTANTE: antes de crear el índice único comprueba que no existan filas "duplicadas" por hora:minuto.

BEGIN;

-- 1) Comprobar si existen duplicados por hora+minuto (sin importar fecha ni ramo)
-- Si la consulta devuelve filas, debes revisar/limpiar esos registros antes de continuar.
-- Ejecuta la siguiente consulta para revisar duplicados:
-- SELECT EXTRACT(HOUR FROM fechaProgramada) AS hh, EXTRACT(MINUTE FROM fechaProgramada) AS mm, COUNT(*)
-- FROM evaluaciones
-- GROUP BY hh, mm
-- HAVING COUNT(*) > 1;

-- 2) Convertir la columna a timestamp (si aún es DATE)
ALTER TABLE evaluaciones
  ALTER COLUMN "fechaProgramada" TYPE timestamp
  USING fechaProgramada::timestamp;

-- 3) (Opcional) Si quieres además asegurar que las inserciones futuras no creen duplicados
-- por hora+minuto, crea un índice único funcional basado en hora y minuto.
-- Nota: esto obliga a que no existan dos filas con la misma hora y minuto.
-- Si tu versión de Postgres soporta columnas generadas, una alternativa es crear una columna
-- "hora_minutos" generada y crear un índice único sobre ella.

-- Índice funcional (hora, minuto)
CREATE UNIQUE INDEX IF NOT EXISTS uq_evaluaciones_hora_minuto ON evaluaciones (
  (EXTRACT(HOUR FROM fechaProgramada))::int,
  (EXTRACT(MINUTE FROM fechaProgramada))::int
);

COMMIT;

-- Instrucciones de uso (PowerShell):
-- 1) Copia este archivo al servidor de base de datos (o ejecuta psql desde la máquina que tiene acceso a la BD).
-- 2) Antes de ejecutar: verifica duplicados con la consulta indicada arriba.
-- 3) Ejecuta (ejemplo):
-- $env:PGPASSWORD = "<DB_PASSWORD>"
-- psql -h <DB_HOST> -U <DB_USERNAME> -d <DB_NAME> -f "Backend/migrations/20251110_convert_fechaProgramada_to_timestamp.sql"
-- Remove-Item Env:\PGPASSWORD

-- Sustituye <DB_HOST>, <DB_USERNAME>, <DB_NAME> y <DB_PASSWORD> por los valores reales de tu .env.
-- Ejemplo con datos típicos (ajusta según tu .env):
-- $env:PGPASSWORD = "06082004"
-- psql -h localhost -U postgres -d isw_proyecto_db -f "Backend/migrations/20251110_convert_fechaProgramada_to_timestamp.sql"
-- Remove-Item Env:\PGPASSWORD
