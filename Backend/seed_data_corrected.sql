-- =====================================================
-- SCRIPT DE PRUEBA PARA POBLAR BD CON DATOS DE EJEMPLO
-- VERSIÓN CORREGIDA - Usa UUID como en la BD actual
-- =====================================================

-- 1. LIMPIAR DATOS ANTERIORES (OPCIONAL - Comentar si no quieres borrar)
-- DELETE FROM events;
-- DELETE FROM users;
-- DELETE FROM ramos;

-- 2. INSERTAR USUARIOS (Profesores, Alumnos, Admin)
INSERT INTO users (email, password, first_name, last_name, role, created_at, updated_at) VALUES
('profesor1@ubiobio.cl', '$2b$10$hashed_password_1', 'Carlos', 'González', 'profesor', NOW(), NOW()),
('profesor2@ubiobio.cl', '$2b$10$hashed_password_2', 'María', 'López', 'profesor', NOW(), NOW()),
('admin@ubiobio.cl', '$2b$10$hashed_password_admin', 'Admin', 'Sistema', 'admin', NOW(), NOW()),
('jefe_carrera@ubiobio.cl', '$2b$10$hashed_password_jefe', 'Jefe', 'Carrera', 'jefe_carrera', NOW(), NOW()),
('alumno1@ubiobio.cl', '$2b$10$hashed_password_a1', 'Juan', 'Silva', 'alumno', NOW(), NOW()),
('alumno2@ubiobio.cl', '$2b$10$hashed_password_a2', 'Ana', 'Fernández', 'alumno', NOW(), NOW()),
('alumno3@ubiobio.cl', '$2b$10$hashed_password_a3', 'Luis', 'Muñoz', 'alumno', NOW(), NOW()),
('alumno4@ubiobio.cl', '$2b$10$hashed_password_a4', 'Patricia', 'Díaz', 'alumno', NOW(), NOW()),
('alumno5@ubiobio.cl', '$2b$10$hashed_password_a5', 'Roberto', 'Campos', 'alumno', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. INSERTAR RAMOS
INSERT INTO ramos (codigo, nombre, descripcion, created_at, updated_at) VALUES
('DER-101', 'Derecho Civil I', 'Introducción al Derecho Civil y sus conceptos fundamentales', NOW(), NOW()),
('DER-102', 'Derecho Penal', 'Derecho Penal General y Especial', NOW(), NOW()),
('DER-201', 'Derecho Constitucional', 'Estudio de la Constitución y Derecho Público', NOW(), NOW()),
('DER-202', 'Derecho Laboral', 'Derecho del Trabajo y Relaciones Laborales', NOW(), NOW())
ON CONFLICT (codigo) DO NOTHING;

-- 4. INSERTAR SECCIONES
INSERT INTO secciones (numero, ramo_id, capacidad, created_at, updated_at) VALUES
('A', (SELECT id FROM ramos WHERE codigo = 'DER-101'), 30, NOW(), NOW()),
('B', (SELECT id FROM ramos WHERE codigo = 'DER-101'), 30, NOW(), NOW()),
('A', (SELECT id FROM ramos WHERE codigo = 'DER-102'), 25, NOW(), NOW()),
('A', (SELECT id FROM ramos WHERE codigo = 'DER-201'), 35, NOW(), NOW()),
('B', (SELECT id FROM ramos WHERE codigo = 'DER-202'), 28, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 5. INSERTAR TIPOS DE EVENTOS
INSERT INTO tipos_eventos (nombre, color, descripcion, created_at, updated_at) VALUES
('CERTAMEN', '#FF6B6B', 'Evaluación escrita formal', NOW(), NOW()),
('INTERROGACIÓN', '#4ECDC4', 'Prueba corta', NOW(), NOW()),
('PRESENTACIÓN', '#95E1D3', 'Presentación de trabajo', NOW(), NOW()),
('REUNIÓN', '#FFE66D', 'Reunión o asesoría', NOW(), NOW()),
('TRABAJO GRUPAL', '#A8E6CF', 'Proyecto grupal', NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;

-- 6. INSERTAR EVENTOS (Requiere IDs de profesores desde users)
-- Reemplaza los UUIDs con los valores reales de la tabla users para profesores
-- Obtén con: SELECT id, email FROM users WHERE role = 'profesor'
INSERT INTO eventos (nombre, descripcion, estado, fecha_inicio, fecha_fin, modalidad, tipo_evento_id, profesor_id, ramo_id, seccion_id, cupo_maximo, cupo_disponible, permit_parejas, sala, created_at, updated_at) VALUES
('Certamen 1 - Derecho Civil I', 'Evaluación sobre temas 1 a 5 del curso', 'confirmado', '2025-12-30 09:00:00', '2025-12-30 11:00:00', 'presencial', 
  (SELECT id FROM tipos_eventos WHERE nombre = 'CERTAMEN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-101'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101')),
  30, 30, false, 'Sala 301', NOW(), NOW()),

('Interrogación 1 - Derecho Civil I', 'Prueba corta sobre causales de nulidad', 'confirmado', '2026-01-10 10:00:00', '2026-01-10 11:00:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'INTERROGACIÓN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-101'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101')),
  30, 30, false, 'Sala 301', NOW(), NOW()),

('Certamen Derecho Penal', 'Evaluación sobre delitos contra la persona', 'pendiente', '2026-01-15 09:00:00', '2026-01-15 11:30:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'CERTAMEN'),
  (SELECT id FROM users WHERE email = 'profesor2@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-102'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-102')),
  25, 25, false, 'Sala 305', NOW(), NOW()),

('Presentación Trabajo Final Constitucional', 'Presentación de investigación sobre derechos fundamentales', 'confirmado', '2026-01-20 14:00:00', '2026-01-20 17:00:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'PRESENTACIÓN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-201'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-201')),
  35, 35, false, 'Auditorio', NOW(), NOW()),

('Asesoría Online - Derecho Laboral', 'Sesión de consultas y dudas', 'confirmado', '2026-01-22 18:00:00', '2026-01-22 19:30:00', 'online',
  (SELECT id FROM tipos_eventos WHERE nombre = 'REUNIÓN'),
  (SELECT id FROM users WHERE email = 'profesor2@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-202'),
  (SELECT id FROM secciones WHERE numero = 'B' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-202')),
  30, 30, false, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 7. INSERTAR BLOQUEOS (OPCIONAL - días sin evaluaciones)
INSERT INTO bloqueos (fecha_inicio, fecha_fin, razon, created_at, updated_at) VALUES
('2025-12-24', '2025-12-25', 'Feriado Navidad', NOW(), NOW()),
('2025-12-31', '2026-01-01', 'Feriado Año Nuevo', NOW(), NOW()),
('2026-02-14', '2026-02-14', 'Día de Descanso Académico', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN - Ejecuta estas consultas para comprobar
-- =====================================================
SELECT 'Users' as tabla, COUNT(*) as cantidad FROM users;
SELECT 'Ramos' as tabla, COUNT(*) as cantidad FROM ramos;
SELECT 'Secciones' as tabla, COUNT(*) as cantidad FROM secciones;
SELECT 'Tipos_Eventos' as tabla, COUNT(*) as cantidad FROM tipos_eventos;
SELECT 'Eventos' as tabla, COUNT(*) as cantidad FROM eventos;
SELECT 'Bloqueos' as tabla, COUNT(*) as cantidad FROM bloqueos;

-- Ver usuarios creados
SELECT email, first_name, last_name, role FROM users ORDER BY email;

-- Ver eventos con detalles
SELECT e.nombre, e.estado, e.fecha_inicio, r.codigo as ramo, s.numero as seccion, t.nombre as tipo
FROM eventos e
JOIN ramos r ON e.ramo_id = r.id
JOIN secciones s ON e.seccion_id = s.id
JOIN tipos_eventos t ON e.tipo_evento_id = t.id
ORDER BY e.fecha_inicio;
