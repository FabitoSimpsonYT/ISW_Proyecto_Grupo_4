-- ═══════════════════════════════════════════════════════════════════════════════
-- 📊 PRECARGA DE DATOS - SQL PURO
-- ═════════════════════════════════════════════════════════════════════════════════
-- Este archivo carga datos de prueba directamente en PostgreSQL sin usar Node.js
-- Uso: psql -U postgres test3 < seed.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMPIAR DATOS PREVIOS
-- ═════════════════════════════════════════════════════════════════════════════════

DELETE FROM pauta_puntajes;
DELETE FROM pauta_evaluada_integradora;
DELETE FROM pautas_evaluadas;
DELETE FROM pauta;
DELETE FROM retroalimentaciones;
DELETE FROM apelaciones;
DELETE FROM alumno_promedio_ramo;
DELETE FROM evaluacion_integradora;
DELETE FROM evaluaciones;
DELETE FROM inscripcion_slot;
DELETE FROM slot;
DELETE FROM evento;
DELETE FROM tipos_eventos;
DELETE FROM bloqueo_profesor;
DELETE FROM alumno_seccion;
DELETE FROM seccion_profesor;
DELETE FROM seccion;
DELETE FROM ramo;
DELETE FROM usuarios;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREAR USUARIOS
-- ═════════════════════════════════════════════════════════════════════════════════

-- Contraseña generada con bcrypt (ejemplo: admin123)
-- Hash real: $2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD
-- Para pruebas, usar contraseña hasheada correcta

INSERT INTO usuarios (rut, nombre, apellido, email, password, rol, estado)
VALUES 
('11111111-1', 'Admin', 'Sistema', 'admin@sistema.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'admin', true),

('22222222-2', 'Juan', 'Pérez', 'jefe@carrera.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'jefe de carrera', true),

-- Profesores
('33333333-3', 'María', 'García', 'maria.garcia@profesor.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'profesor', true),

('44444444-4', 'Carlos', 'López', 'carlos.lopez@profesor.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'profesor', true),

('55555555-5', 'Patricia', 'Martínez', 'patricia.martinez@profesor.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'profesor', true),

('66666666-6', 'Roberto', 'Rodríguez', 'roberto.rodriguez@profesor.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'profesor', true),

-- Alumnos
('77777777-7', 'Diego', 'Sánchez', 'diego.sanchez@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('88888888-8', 'Laura', 'Jiménez', 'laura.jimenez@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('99999999-9', 'Andrea', 'Flores', 'andrea.flores@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('10101010-1', 'Felipe', 'Díaz', 'felipe.diaz@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('11121212-2', 'Sofía', 'Campos', 'sofia.campos@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('13131313-3', 'Miguel', 'Torres', 'miguel.torres@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('14141414-4', 'Carla', 'Vargas', 'carla.vargas@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true),

('15151515-5', 'Andrés', 'Morales', 'andres.morales@alumno.cl', 
  '$2a$10$Y7xpw9FPKfI8mfQDmHEYNuUmNz2Zl2y1K8Z9xY7xpw9FPKfI8mfQD', 'alumno', true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREAR RAMOS (CURSOS)
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO ramo (codigo, nombre, creditos)
VALUES 
('INF111', 'Programación I', 4),
('INF112', 'Programación II', 4),
('INF211', 'Algoritmos', 4),
('INF212', 'Estructura de Datos', 4),
('INF311', 'Base de Datos', 4);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREAR SECCIONES
-- ═════════════════════════════════════════════════════════════════════════════════

-- Las secciones se crean con el ID automático
-- Sección 1 de INF111 (Ramo ID 1) con profesor María
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF111'), 1)
RETURNING id;

-- Sección 2 de INF111 con profesor Carlos
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF111'), 2)
RETURNING id;

-- Sección 1 de INF112 con profesor Patricia
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF112'), 1)
RETURNING id;

-- Sección 1 de INF211 con profesor Roberto
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF211'), 1)
RETURNING id;

-- Sección 1 de INF212 con profesor María
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF212'), 1)
RETURNING id;

-- Sección 1 de INF311 con profesor Carlos
INSERT INTO seccion (id_ramo, numero_seccion)
VALUES ((SELECT id FROM ramo WHERE codigo='INF311'), 1)
RETURNING id;

-- ═════════════════════════════════════════════════════════════════════════════════
-- ASIGNAR PROFESORES A SECCIONES
-- ═════════════════════════════════════════════════════════════════════════════════

-- INF111 Sección 1 - María (33333333-3)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF111' AND s.numero_seccion=1), '33333333-3';

-- INF111 Sección 2 - Carlos (44444444-4)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF111' AND s.numero_seccion=2), '44444444-4';

-- INF112 Sección 1 - Patricia (55555555-5)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF112' AND s.numero_seccion=1), '55555555-5';

-- INF211 Sección 1 - Roberto (66666666-6)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF211' AND s.numero_seccion=1), '66666666-6';

-- INF212 Sección 1 - María (33333333-3)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF212' AND s.numero_seccion=1), '33333333-3';

-- INF311 Sección 1 - Carlos (44444444-4)
INSERT INTO seccion_profesor (id_seccion, rut_profesor)
SELECT (SELECT id FROM seccion s 
        JOIN ramo r ON s.id_ramo = r.id 
        WHERE r.codigo='INF311' AND s.numero_seccion=1), '44444444-4';

-- ═════════════════════════════════════════════════════════════════════════════════
-- INSCRIBIR ALUMNOS EN SECCIONES
-- ═════════════════════════════════════════════════════════════════════════════════

-- INF111 Sección 1
INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '77777777-7', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF111' AND s.numero_seccion=1;

INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '88888888-8', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF111' AND s.numero_seccion=1;

INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '99999999-9', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF111' AND s.numero_seccion=1;

-- INF111 Sección 2
INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '10101010-1', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF111' AND s.numero_seccion=2;

-- INF112 Sección 1
INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '77777777-7', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF112' AND s.numero_seccion=1;

INSERT INTO alumno_seccion (rut_alumno, id_seccion)
SELECT '88888888-8', id FROM seccion s 
  JOIN ramo r ON s.id_ramo = r.id 
  WHERE r.codigo='INF112' AND s.numero_seccion=1;

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR TIPOS DE EVENTOS
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO tipos_eventos (nombre, color)
VALUES 
('Evaluación Teórica', '#FF6B6B'),
('Evaluación Práctica', '#4ECDC4'),
('Proyecto', '#45B7D1'),
('Examen Final', '#FFA07A');

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR EVENTOS
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO evento (nombre, descripcion, id_tipo_evento, rut_profesor, fecha_programada, duracion_minutos)
VALUES 
('Evaluación 1 - Variables y Operadores', 'Evaluación de conceptos básicos', 
  (SELECT id FROM tipos_eventos WHERE nombre='Evaluación Teórica'), 
  '33333333-3', NOW() + INTERVAL '5 days', 90),

('Evaluación 2 - Funciones', 'Evaluación de funciones y procedimientos', 
  (SELECT id FROM tipos_eventos WHERE nombre='Evaluación Teórica'), 
  '33333333-3', NOW() + INTERVAL '12 days', 90),

('Evaluación 1 - POO Básico', 'Programación Orientada a Objetos básico', 
  (SELECT id FROM tipos_eventos WHERE nombre='Evaluación Práctica'), 
  '55555555-5', NOW() + INTERVAL '7 days', 120);

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR EVALUACIONES
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO evaluaciones (id_evento, id_ramo, nombre, descripcion, tipo_evaluacion)
VALUES 
((SELECT MAX(id) FROM evento WHERE nombre='Evaluación 1 - Variables y Operadores'),
  (SELECT id FROM ramo WHERE codigo='INF111'),
  'Evaluación 1 - Variables y Operadores', 'Test de conceptos básicos', 'parcial'),

((SELECT MAX(id) FROM evento WHERE nombre='Evaluación 2 - Funciones'),
  (SELECT id FROM ramo WHERE codigo='INF111'),
  'Evaluación 2 - Funciones', 'Test de funciones', 'parcial'),

((SELECT MAX(id) FROM evento WHERE nombre='Evaluación 1 - POO Básico'),
  (SELECT id FROM ramo WHERE codigo='INF112'),
  'Evaluación 1 - POO Básico', 'Evaluación práctica de POO', 'parcial');

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR SLOTS
-- ═════════════════════════════════════════════════════════════════════════════════

-- Slots para evento 1 (max 3 slots)
INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 1, '08:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 1 - Variables y Operadores' LIMIT 1;

INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 2, '10:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 1 - Variables y Operadores' LIMIT 1;

INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 3, '12:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 1 - Variables y Operadores' LIMIT 1;

-- Slots para evento 2
INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 1, '08:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 2 - Funciones' LIMIT 1;

INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 2, '10:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 2 - Funciones' LIMIT 1;

-- Slots para evento 3
INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 1, '09:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 1 - POO Básico' LIMIT 1;

INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
SELECT id, 2, '11:00:00', 'disponible' FROM evento 
WHERE nombre='Evaluación 1 - POO Básico' LIMIT 1;

-- ═════════════════════════════════════════════════════════════════════════════════
-- INSCRIBIR ALUMNOS EN SLOTS
-- ═════════════════════════════════════════════════════════════════════════════════

-- Alumno 1 en slot 1 del evento 1
INSERT INTO inscripcion_slot (rut_alumno, id_slot)
SELECT '77777777-7', 
  (SELECT s.id FROM slot s 
   JOIN evento e ON s.id_evento = e.id 
   WHERE e.nombre='Evaluación 1 - Variables y Operadores' 
   AND s.numero_slot=1 LIMIT 1);

-- Alumno 2 en slot 2 del evento 1
INSERT INTO inscripcion_slot (rut_alumno, id_slot)
SELECT '88888888-8', 
  (SELECT s.id FROM slot s 
   JOIN evento e ON s.id_evento = e.id 
   WHERE e.nombre='Evaluación 1 - Variables y Operadores' 
   AND s.numero_slot=2 LIMIT 1);

-- Alumno 3 en slot 3 del evento 1
INSERT INTO inscripcion_slot (rut_alumno, id_slot)
SELECT '99999999-9', 
  (SELECT s.id FROM slot s 
   JOIN evento e ON s.id_evento = e.id 
   WHERE e.nombre='Evaluación 1 - Variables y Operadores' 
   AND s.numero_slot=3 LIMIT 1);

-- Alumno 4 en slot 1 del evento 2
INSERT INTO inscripcion_slot (rut_alumno, id_slot)
SELECT '10101010-1', 
  (SELECT s.id FROM slot s 
   JOIN evento e ON s.id_evento = e.id 
   WHERE e.nombre='Evaluación 2 - Funciones' 
   AND s.numero_slot=1 LIMIT 1);

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR PAUTAS DE EVALUACIÓN
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO pauta (id_evaluacion, nombre, descripcion, puntaje_total)
VALUES 
((SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 1 - Variables y Operadores'),
  'Pauta Evaluación 1', 'Rúbrica para evaluación 1', 100),

((SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 2 - Funciones'),
  'Pauta Evaluación 2', 'Rúbrica para evaluación 2', 100),

((SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 1 - POO Básico'),
  'Pauta Evaluación POO', 'Rúbrica para evaluación POO', 100);

-- ═════════════════════════════════════════════════════════════════════════════════
-- AGREGAR CRITERIOS A PAUTAS
-- ═════════════════════════════════════════════════════════════════════════════════

-- Criterios para Pauta 1
INSERT INTO pauta_puntajes (id_pauta, nombre_criterio, puntaje_maximo)
VALUES 
((SELECT MAX(id) FROM pauta), 'Conceptos', 30),
((SELECT MAX(id) FROM pauta), 'Aplicación', 35),
((SELECT MAX(id) FROM pauta), 'Presentación', 20),
((SELECT MAX(id) FROM pauta), 'Participación', 15);

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR RETROALIMENTACIONES
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO retroalimentaciones (rut_alumno, rut_profesor, id_evaluacion, contenido, fecha_creacion)
VALUES 
('77777777-7', '33333333-3', 
  (SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 1 - Variables y Operadores'),
  'Excelente ejecución de conceptos. Trabaja en la presentación.', NOW()),

('88888888-8', '33333333-3', 
  (SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 1 - Variables y Operadores'),
  'Buen desempeño. Amplía ejemplos en la aplicación.', NOW()),

('99999999-9', '33333333-3', 
  (SELECT MAX(id) FROM evaluaciones WHERE nombre='Evaluación 1 - Variables y Operadores'),
  'Necesitas revisar algunos conceptos teóricos.', NOW());

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREAR BLOQUEOS
-- ═════════════════════════════════════════════════════════════════════════════════

INSERT INTO bloqueo_profesor (rut_profesor, fecha_inicio, fecha_fin, razon)
VALUES 
('33333333-3', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', 'Vacaciones semestral'),
('33333333-3', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', 'Semana de exámenes'),
('44444444-4', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', 'Receso académico');

-- ═════════════════════════════════════════════════════════════════════════════════
-- RESUMEN FINAL
-- ═════════════════════════════════════════════════════════════════════════════════

SELECT 
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM ramo) as total_ramos,
  (SELECT COUNT(*) FROM seccion) as total_secciones,
  (SELECT COUNT(*) FROM alumno_seccion) as alumnos_en_secciones,
  (SELECT COUNT(*) FROM evento) as total_eventos,
  (SELECT COUNT(*) FROM slot) as total_slots,
  (SELECT COUNT(*) FROM inscripcion_slot) as alumnos_en_slots,
  (SELECT COUNT(*) FROM pauta) as total_pautas,
  (SELECT COUNT(*) FROM retroalimentaciones) as total_retroalimentaciones,
  (SELECT COUNT(*) FROM bloqueo_profesor) as total_bloqueos;

-- ═════════════════════════════════════════════════════════════════════════════════
-- CREDENCIALES DE PRUEBA:
-- Admin:    RUT: 11111111-1, Contraseña: admin123
-- Jefe:     RUT: 22222222-2, Contraseña: jefe123
-- Profesor: RUT: 33333333-3, Contraseña: profesor123
-- Alumno:   RUT: 77777777-7, Contraseña: alumno123
-- ═════════════════════════════════════════════════════════════════════════════════
