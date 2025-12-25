-- =====================================================
-- SCRIPT DE PRUEBA PARA POBLAR BD CON DATOS DE EJEMPLO
-- Copia y pega esto en PostgreSQL
-- =====================================================

-- 1. INSERTAR USUARIOS (Profesores y Alumnos)
INSERT INTO users (rut, nombres, apellido_paterno, apellido_materno, email, password, role, telefono, created_at, updated_at) VALUES
('12345678-1', 'Carlos', 'González', 'Pérez', 'profesor1@ubiobio.cl', '$2b$10$hashed1', 'profesor', '+56912345678', NOW(), NOW()),
('12345679-2', 'María', 'López', 'García', 'profesor2@ubiobio.cl', '$2b$10$hashed2', 'profesor', '+56912345679', NOW(), NOW()),
('11111111-1', 'Admin', 'Sistema', 'Ubiobio', 'admin@ubiobio.cl', '$2b$10$hashedA', 'admin', '+56900000001', NOW(), NOW()),
('22222222-2', 'Jefe', 'Carrera', 'Derecho', 'jefe_carrera@ubiobio.cl', '$2b$10$hashedJ', 'jefecarrera', '+56900000002', NOW(), NOW()),
('15555555-1', 'Juan', 'Silva', 'Rodríguez', 'alumno1@ubiobio.cl', '$2b$10$hashed3', 'alumno', '+56987654321', NOW(), NOW()),
('15666666-2', 'Ana', 'Fernández', 'Martínez', 'alumno2@ubiobio.cl', '$2b$10$hashed4', 'alumno', '+56987654322', NOW(), NOW()),
('15777777-3', 'Luis', 'Muñoz', 'Torres', 'alumno3@ubiobio.cl', '$2b$10$hashed5', 'alumno', '+56987654323', NOW(), NOW()),
('15888888-4', 'Patricia', 'Díaz', 'Flores', 'alumno4@ubiobio.cl', '$2b$10$hashed6', 'alumno', '+56987654324', NOW(), NOW()),
('15999999-5', 'Roberto', 'Campos', 'Soto', 'alumno5@ubiobio.cl', '$2b$10$hashed7', 'alumno', '+56987654325', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. INSERTAR PROFESORES
INSERT INTO profesores (id, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'), NOW(), NOW()),
((SELECT id FROM users WHERE email = 'profesor2@ubiobio.cl'), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. INSERTAR ALUMNOS  
INSERT INTO alumnos (id, generacion, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'alumno1@ubiobio.cl'), '2023', NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno2@ubiobio.cl'), '2023', NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno3@ubiobio.cl'), '2024', NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno4@ubiobio.cl'), '2024', NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno5@ubiobio.cl'), '2023', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. INSERTAR RAMOS
INSERT INTO ramos (codigo, nombre, descripcion, created_at, updated_at) VALUES
('DER-101', 'Derecho Civil I', 'Introducción al Derecho Civil y sus conceptos fundamentales', NOW(), NOW()),
('DER-102', 'Derecho Penal', 'Derecho Penal General y Especial', NOW(), NOW()),
('DER-201', 'Derecho Constitucional', 'Estudio de la Constitución y Derecho Público', NOW(), NOW()),
('DER-202', 'Derecho Laboral', 'Derecho del Trabajo y Relaciones Laborales', NOW(), NOW())
ON CONFLICT (codigo) DO NOTHING;

-- 5. INSERTAR SECCIONES
INSERT INTO secciones (numero, ramo_id, capacidad, created_at, updated_at) VALUES
('A', (SELECT id FROM ramos WHERE codigo = 'DER-101'), 30, NOW(), NOW()),
('B', (SELECT id FROM ramos WHERE codigo = 'DER-101'), 30, NOW(), NOW()),
('A', (SELECT id FROM ramos WHERE codigo = 'DER-102'), 25, NOW(), NOW()),
('A', (SELECT id FROM ramos WHERE codigo = 'DER-201'), 35, NOW(), NOW()),
('B', (SELECT id FROM ramos WHERE codigo = 'DER-202'), 28, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 6. RELACIONAR ALUMNOS CON SECCIONES (seccion_alumnos)
INSERT INTO seccion_alumnos (alumno_id, seccion_id, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'alumno1@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101') LIMIT 1), NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno2@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101') LIMIT 1), NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno3@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'B' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101') LIMIT 1), NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno4@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-102') LIMIT 1), NOW(), NOW()),
((SELECT id FROM users WHERE email = 'alumno5@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-201') LIMIT 1), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 7. INSERTAR TIPOS DE EVENTOS
INSERT INTO tipos_eventos (nombre, color, descripcion, created_at, updated_at) VALUES
('CERTAMEN', '#FF6B6B', 'Evaluación escrita formal', NOW(), NOW()),
('INTERROGACIÓN', '#4ECDC4', 'Prueba corta', NOW(), NOW()),
('PRESENTACIÓN', '#95E1D3', 'Presentación de trabajo', NOW(), NOW()),
('REUNIÓN', '#FFE66D', 'Reunión o asesoría', NOW(), NOW()),
('TRABAJO GRUPAL', '#A8E6CF', 'Proyecto grupal', NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;-- 7. INSERTAR TIPOS DE EVENTOS
INSERT INTO tipos_eventos (nombre, color, descripcion, created_at, updated_at) VALUES
('CERTAMEN', '#FF6B6B', 'Evaluación escrita formal', NOW(), NOW()),
('INTERROGACIÓN', '#4ECDC4', 'Prueba corta', NOW(), NOW()),
('PRESENTACIÓN', '#95E1D3', 'Presentación de trabajo', NOW(), NOW()),
('REUNIÓN', '#FFE66D', 'Reunión o asesoría', NOW(), NOW()),
('TRABAJO GRUPAL', '#A8E6CF', 'Proyecto grupal', NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;

-- 8. INSERTAR EVENTOS
INSERT INTO eventos (nombre, descripcion, estado, fecha_inicio, fecha_fin, modalidad, tipo_evento_id, profesor_id, ramo_id, seccion_id, duracion_por_alumno, cupo_maximo, cupo_disponible, permit_parejas, sala, created_at, updated_at) VALUES
('Certamen 1 - Derecho Civil I', 'Evaluación sobre temas 1 a 5 del curso', 'confirmado', '2025-12-30 09:00:00', '2025-12-30 11:00:00', 'presencial', 
  (SELECT id FROM tipos_eventos WHERE nombre = 'CERTAMEN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-101'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101') LIMIT 1),
  NULL, 30, 30, false, 'Sala 301', NOW(), NOW()),

('Interrogación 1 - Derecho Civil I', 'Prueba corta sobre causales de nulidad', 'confirmado', '2026-01-10 10:00:00', '2026-01-10 11:00:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'INTERROGACIÓN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-101'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-101') LIMIT 1),
  NULL, 30, 30, false, 'Sala 301', NOW(), NOW()),

('Certamen Derecho Penal', 'Evaluación sobre delitos contra la persona', 'pendiente', '2026-01-15 09:00:00', '2026-01-15 11:30:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'CERTAMEN'),
  (SELECT id FROM users WHERE email = 'profesor2@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-102'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-102') LIMIT 1),
  NULL, 25, 25, false, 'Sala 305', NOW(), NOW()),

('Presentación Trabajo Final Constitucional', 'Presentación de investigación sobre derechos fundamentales', 'confirmado', '2026-01-20 14:00:00', '2026-01-20 17:00:00', 'presencial',
  (SELECT id FROM tipos_eventos WHERE nombre = 'PRESENTACIÓN'),
  (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-201'),
  (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-201') LIMIT 1),
  15, 35, 35, false, 'Auditorio', NOW(), NOW()),

('Asesoría Online - Derecho Laboral', 'Sesión de consultas y dudas', 'confirmado', '2026-01-22 18:00:00', '2026-01-22 19:30:00', 'online',
  (SELECT id FROM tipos_eventos WHERE nombre = 'REUNIÓN'),
  (SELECT id FROM users WHERE email = 'profesor2@ubiobio.cl'),
  (SELECT id FROM ramos WHERE codigo = 'DER-202'),
  (SELECT id FROM secciones WHERE numero = 'B' AND ramo_id = (SELECT id FROM ramos WHERE codigo = 'DER-202') LIMIT 1),
  NULL, 30, 30, false, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 9. INSERTAR BLOQUEOS (opcional - días sin evaluaciones)
INSERT INTO bloqueos (fecha_inicio, fecha_fin, razon, created_at, updated_at) VALUES
('2025-12-24', '2025-12-25', 'Feriado Navidad', NOW(), NOW()),
('2025-12-31', '2026-01-01', 'Feriado Año Nuevo', NOW(), NOW()),
('2026-02-14', '2026-02-14', 'Día de Descanso Académico', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN - Ejecuta estas consultas para comprobar
-- =====================================================
SELECT 'Users' as tabla, COUNT(*) as cantidad FROM users;
SELECT 'Profesores' as tabla, COUNT(*) as cantidad FROM profesores;
SELECT 'Alumnos' as tabla, COUNT(*) as cantidad FROM alumnos;
SELECT 'Ramos' as tabla, COUNT(*) as cantidad FROM ramos;
SELECT 'Secciones' as tabla, COUNT(*) as cantidad FROM secciones;
SELECT 'Seccion_Alumnos' as tabla, COUNT(*) as cantidad FROM seccion_alumnos;
SELECT 'Tipos_Eventos' as tabla, COUNT(*) as cantidad FROM tipos_eventos;
SELECT 'Eventos' as tabla, COUNT(*) as cantidad FROM eventos;
SELECT 'Bloqueos' as tabla, COUNT(*) as cantidad FROM bloqueos;

-- Ver usuarios creados
SELECT email, nombres, apellido_paterno, apellido_materno, role FROM users ORDER BY email;

-- Ver eventos con detalles
SELECT e.nombre, e.estado, e.fecha_inicio, r.codigo as ramo, s.numero as seccion, t.nombre as tipo
FROM eventos e
JOIN ramos r ON e.ramo_id = r.id
JOIN secciones s ON e.seccion_id = s.id
JOIN tipos_eventos t ON e.tipo_evento_id = t.id
ORDER BY e.fecha_inicio;
