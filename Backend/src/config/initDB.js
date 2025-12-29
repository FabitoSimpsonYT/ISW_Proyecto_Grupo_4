"use strict";

import bcrypt from "bcrypt";
import { AppDataSource } from "./configDb.js";
import { User } from "../entities/user.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { query } from "./database.js";

export async function initDB() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("=> Conexión a la base de datos inicializada desde initDB");
    }
    await createUsers();
    await createTestData();
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    process.exit(1);
  }
}

export async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const profesorRepository = AppDataSource.getRepository(Profesor);
    const alumnoRepository = AppDataSource.getRepository(Alumno);

    const count = await userRepository.count();
    if (count > 0) {
      console.log("✅ Usuarios ya existen, omitiendo creación de datos por defecto.");
      return;
    }

    console.log("🔄 Creando usuarios y perfiles por defecto...");

    // Admin
    const adminUser = userRepository.create({
      nombres: "Admin",
      apellidoPaterno: "Sistema",
      apellidoMaterno: "Ubiobio",
      rut: "11111111-1",
      email: "admin@ubiobio.cl",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      telefono: "+56900000001"
    });
    await userRepository.save(adminUser);
    console.log(`✅ Usuario admin '${adminUser.email}' creado.`);

    // Jefe de Carrera
    const jefeUser = userRepository.create({
      nombres: "Jefe",
      apellidoPaterno: "Carrera",
      apellidoMaterno: "Derecho",
      rut: "22222222-2",
      email: "jefe_carrera@ubiobio.cl",
      password: await bcrypt.hash("jefe123", 10),
      role: "jefecarrera",
      telefono: "+56900000002"
    });
    await userRepository.save(jefeUser);
    console.log(`✅ Jefe de carrera '${jefeUser.email}' creado.`);

    // Profesor 1
    const profesor1User = userRepository.create({
      nombres: "Carlos",
      apellidoPaterno: "González",
      apellidoMaterno: "Pérez",
      rut: "12345678-1",
      email: "profesor1@ubiobio.cl",
      password: await bcrypt.hash("profesor123", 10),
      role: "profesor",
      telefono: "+56912345678"
    });
    await userRepository.save(profesor1User);

    const profesor1Profile = profesorRepository.create({
      id: profesor1User.id,
      especialidad: "Derecho Civil",
      user: profesor1User
    });
    await profesorRepository.save(profesor1Profile);
    console.log(`✅ Profesor '${profesor1User.email}' creado.`);

    // Alumno
    const alumnoUser = userRepository.create({
      nombres: "Juan",
      apellidoPaterno: "Silva",
      apellidoMaterno: "Rodríguez",
      rut: "15555555-1",
      email: "alumno1@ubiobio.cl",
      password: await bcrypt.hash("alumno123", 10),
      role: "alumno",
      telefono: "+56987654321"
    });
    await userRepository.save(alumnoUser);

    const alumnoProfile = alumnoRepository.create({
      id: alumnoUser.id,
      generacion: "2023",
      user: alumnoUser
    });
    await alumnoRepository.save(alumnoProfile);
    console.log(`✅ Alumno '${alumnoUser.email}' creado.`);

    console.log("🎉 Todos los usuarios y perfiles creados exitosamente!");

  } catch (error) {
    console.error("Error al crear usuarios y perfiles:", error);
    process.exit(1);
  }
}

export async function createTestData() {
  try {
    // Verificar si ya existen datos de prueba
    const ramosCount = await query('SELECT COUNT(*) FROM ramos');
    if (ramosCount.rows[0].count > 0) {
      console.log("✅ Datos de prueba ya existen, omitiendo.");
      return;
    }

    console.log("🔄 Creando datos de prueba (ramos, secciones, eventos)...");

    // Insertar ramos con profesores asignados
    await query(`
      INSERT INTO ramos (codigo, nombre, profesor_id, created_at, updated_at) VALUES
      ('620515', 'Derecho Civil I', (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'), NOW(), NOW())
      ON CONFLICT (codigo) DO NOTHING
    `);
    console.log("✅ Ramos creados");

    // Insertar secciones
    // Profesor 1: 1 ramo (620515) con 1 sección
    await query(`
      INSERT INTO secciones (numero, ramo_id, capacidad, created_at, updated_at) VALUES
      ('A', (SELECT id FROM ramos WHERE codigo = '620515'), 30, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Secciones creadas");

    // Relacionar alumnos con secciones
    await query(`
      INSERT INTO seccion_alumnos (alumno_id, seccion_id, created_at, updated_at) VALUES
      ((SELECT id FROM users WHERE email = 'alumno1@ubiobio.cl'), (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = '620515') LIMIT 1), NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Alumnos asociados a secciones");

    // Insertar tipos de eventos
    await query(`
      INSERT INTO tipos_eventos (nombre, color, descripcion, created_at, updated_at) VALUES
      ('CERTAMEN', '#FF6B6B', 'Evaluación escrita formal', NOW(), NOW()),
      ('INTERROGACIÓN', '#4ECDC4', 'Prueba corta', NOW(), NOW()),
      ('PRESENTACIÓN', '#95E1D3', 'Presentación de trabajo', NOW(), NOW()),
      ('REUNIÓN', '#FFE66D', 'Reunión o asesoría', NOW(), NOW()),
      ('TRABAJO GRUPAL', '#A8E6CF', 'Proyecto grupal', NOW(), NOW())
      ON CONFLICT (nombre) DO NOTHING
    `);
    console.log("✅ Tipos de eventos creados");

    // Insertar eventos (más variedad: con y sin slots)
    await query(`
      INSERT INTO eventos (nombre, descripcion, estado, fecha_inicio, fecha_fin, modalidad, tipo_evento_id, profesor_id, ramo_id, seccion_id, cupo_maximo, cupo_disponible, permit_parejas, sala, created_at, updated_at) VALUES
      (
        'Certamen 1 - Derecho Civil I',
        'Evaluación sobre temas 1 a 5 del curso',
        'confirmado',
        '2025-12-30 09:00:00',
        '2025-12-30 11:00:00',
        'presencial',
        (SELECT id FROM tipos_eventos WHERE nombre = 'CERTAMEN'),
        (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
        (SELECT id FROM ramos WHERE codigo = '620515'),
        (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = '620515') LIMIT 1),
        30, 30, false, 'Sala 301', NOW(), NOW()
      ),
      (
        'Interrogación 1 - Derecho Civil I',
        'Prueba corta sobre causales de nulidad',
        'confirmado',
        '2026-01-10 10:00:00',
        '2026-01-10 11:00:00',
        'presencial',
        (SELECT id FROM tipos_eventos WHERE nombre = 'INTERROGACIÓN'),
        (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
        (SELECT id FROM ramos WHERE codigo = '620515'),
        (SELECT id FROM secciones WHERE numero = 'A' AND ramo_id = (SELECT id FROM ramos WHERE codigo = '620515') LIMIT 1),
        30, 30, false, 'Sala 301', NOW(), NOW()
      )
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Eventos creados");

    // Insertar evaluaciones (para los apelaciones)
    await query(`
      INSERT INTO evaluaciones (titulo, "fechaProgramada", "horaInicio", "horaFin", ponderacion, contenidos, estado, "pautaPublicada", aplicada, promedio, ramo_id, profesor_id, created_at, updated_at) VALUES
      (
        'Certamen Civil I',
        '2025-12-30',
        '09:00',
        '11:00',
        20,
        'Capítulos 1-5: Conceptos básicos, sujetos de derecho, objeto del derecho',
        'aplicada',
        true,
        true,
        75.5,
        (SELECT id FROM ramos WHERE codigo = '620515'),
        (SELECT id FROM users WHERE email = 'profesor1@ubiobio.cl'),
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Evaluaciones creadas");

    // Insertar bloqueos
    await query(`
      INSERT INTO bloqueos (fecha_inicio, fecha_fin, razon, created_at, updated_at) VALUES
      ('2025-12-24', '2025-12-25', 'Feriado Navidad', NOW(), NOW()),
      ('2025-12-31', '2026-01-01', 'Feriado Año Nuevo', NOW(), NOW()),
      ('2026-02-14', '2026-02-14', 'Día de Descanso Académico', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Bloqueos creados");

    // Insertar apelaciones de ejemplo
    await query(`
      INSERT INTO "Apelaciones" (tipo, mensaje, estado, "alumno_id", "evaluacion_id", created_at, updated_at) VALUES
      (
        'evaluacion',
        'Considero que mi puntaje no refleja mi desempeño real. He estudiado mucho para esta evaluación.',
        'pendiente',
        (SELECT id FROM users WHERE email = 'alumno1@ubiobio.cl'),
        (SELECT id FROM evaluaciones WHERE titulo = 'Certamen Civil I' LIMIT 1),
        NOW(),
        NOW()
      ),
      (
        'inasistencia',
        'Tenía una cita médica urgente que no pude reprogramar. Adjunto certificado médico.',
        'aceptada',
        (SELECT id FROM users WHERE email = 'alumno1@ubiobio.cl'),
        (SELECT id FROM evaluaciones LIMIT 1),
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `);
    console.log("✅ Apelaciones creadas");

    console.log("🎉 Datos de prueba creados exitosamente!");

  } catch (error) {
    console.error("Error al crear datos de prueba:", error);
    // No hacer exit aquí, permitir que continúe aunque falle esto
  }
}

export default initDB;