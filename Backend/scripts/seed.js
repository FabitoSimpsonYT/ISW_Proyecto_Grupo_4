import { query } from '../src/config/database.js';
import bcrypt from 'bcrypt';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`)
};

// Generar hash de contraseña
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

async function seed() {
  try {
    log.info('Iniciando precarga de datos...\n');

    // ============= LIMPIAR DATOS EXISTENTES =============
    log.warn('Limpiando datos existentes...');
    await query(`
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
    `);
    log.success('Base de datos limpiada\n');

    // ============= CREAR USUARIOS =============
    log.info('Creando usuarios...');
    
    const adminPassword = await hashPassword('admin123');
    const jefePassword = await hashPassword('jefe123');
    const profPassword = await hashPassword('profesor123');
    const alumnoPassword = await hashPassword('alumno123');

    // Admin
    await query(
      `INSERT INTO usuarios (rut, nombre, apellido, email, password, rol, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['11111111-1', 'Admin', 'Sistema', 'admin@sistema.cl', adminPassword, 'admin', true]
    );
    log.success('Usuario Admin creado');

    // Jefe de Carrera
    await query(
      `INSERT INTO usuarios (rut, nombre, apellido, email, password, rol, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['22222222-2', 'Juan', 'Pérez', 'jefe@carrera.cl', jefePassword, 'jefe de carrera', true]
    );
    log.success('Usuario Jefe de Carrera creado');

    // Profesores
    const profesores = [
      ['33333333-3', 'María', 'García', 'maria.garcia@profesor.cl'],
      ['44444444-4', 'Carlos', 'López', 'carlos.lopez@profesor.cl'],
      ['55555555-5', 'Patricia', 'Martínez', 'patricia.martinez@profesor.cl'],
      ['66666666-6', 'Roberto', 'Rodríguez', 'roberto.rodriguez@profesor.cl']
    ];

    for (const [rut, nombre, apellido, email] of profesores) {
      await query(
        `INSERT INTO usuarios (rut, nombre, apellido, email, password, rol, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rut, nombre, apellido, email, profPassword, 'profesor', true]
      );
    }
    log.success(`${profesores.length} Profesores creados`);

    // Alumnos
    const alumnos = [
      ['77777777-7', 'Diego', 'Sánchez', 'diego.sanchez@alumno.cl'],
      ['88888888-8', 'Laura', 'Jiménez', 'laura.jimenez@alumno.cl'],
      ['99999999-9', 'Andrea', 'Flores', 'andrea.flores@alumno.cl'],
      ['10101010-1', 'Felipe', 'Díaz', 'felipe.diaz@alumno.cl'],
      ['11121212-2', 'Sofía', 'Campos', 'sofia.campos@alumno.cl'],
      ['13131313-3', 'Miguel', 'Torres', 'miguel.torres@alumno.cl'],
      ['14141414-4', 'Carla', 'Vargas', 'carla.vargas@alumno.cl'],
      ['15151515-5', 'Andrés', 'Morales', 'andres.morales@alumno.cl'],
    ];

    for (const [rut, nombre, apellido, email] of alumnos) {
      await query(
        `INSERT INTO usuarios (rut, nombre, apellido, email, password, rol, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rut, nombre, apellido, email, alumnoPassword, 'alumno', true]
      );
    }
    log.success(`${alumnos.length} Alumnos creados\n`);

    // ============= CREAR RAMOS =============
    log.info('Creando ramos (cursos)...');
    
    const ramos = [
      { codigo: 'INF111', nombre: 'Programación I', creditos: 4 },
      { codigo: 'INF112', nombre: 'Programación II', creditos: 4 },
      { codigo: 'INF211', nombre: 'Algoritmos', creditos: 4 },
      { codigo: 'INF212', nombre: 'Estructura de Datos', creditos: 4 },
      { codigo: 'INF311', nombre: 'Base de Datos', creditos: 4 },
    ];

    const ramoIds = [];
    for (const ramo of ramos) {
      const result = await query(
        `INSERT INTO ramo (codigo, nombre, creditos) VALUES ($1, $2, $3) RETURNING id`,
        [ramo.codigo, ramo.nombre, ramo.creditos]
      );
      ramoIds.push(result.rows[0].id);
    }
    log.success(`${ramos.length} Ramos creados\n`);

    // ============= CREAR SECCIONES =============
    log.info('Creando secciones...');
    
    const seccionesData = [
      { ramoId: ramoIds[0], numero: 1, profesor: profesores[0][0] }, // INF111 - María
      { ramoId: ramoIds[0], numero: 2, profesor: profesores[1][0] }, // INF111 - Carlos
      { ramoId: ramoIds[1], numero: 1, profesor: profesores[2][0] }, // INF112 - Patricia
      { ramoId: ramoIds[2], numero: 1, profesor: profesores[3][0] }, // INF211 - Roberto
      { ramoId: ramoIds[3], numero: 1, profesor: profesores[0][0] }, // INF212 - María
      { ramoId: ramoIds[4], numero: 1, profesor: profesores[1][0] }, // INF311 - Carlos
    ];

    for (const seccion of seccionesData) {
      const result = await query(
        `INSERT INTO seccion (id_ramo, numero_seccion) VALUES ($1, $2) RETURNING id`,
        [seccion.ramoId, seccion.numero]
      );
      const seccionId = result.rows[0].id;

      // Asignar profesor
      await query(
        `INSERT INTO seccion_profesor (id_seccion, rut_profesor) VALUES ($1, $2)`,
        [seccionId, seccion.profesor]
      );
    }
    log.success(`${seccionesData.length} Secciones creadas\n`);

    // ============= INSCRIBIR ALUMNOS EN SECCIONES =============
    log.info('Inscribiendo alumnos en secciones...');
    
    const alumnoSeccionData = [
      // INF111 - Sección 1
      [alumnos[0][0], ramoIds[0], 1],
      [alumnos[1][0], ramoIds[0], 1],
      [alumnos[2][0], ramoIds[0], 1],
      [alumnos[3][0], ramoIds[0], 1],
      // INF111 - Sección 2
      [alumnos[4][0], ramoIds[0], 2],
      [alumnos[5][0], ramoIds[0], 2],
      [alumnos[6][0], ramoIds[0], 2],
      // INF112 - Sección 1
      [alumnos[0][0], ramoIds[1], 1],
      [alumnos[1][0], ramoIds[1], 1],
      [alumnos[3][0], ramoIds[1], 1],
      // INF211 - Sección 1
      [alumnos[0][0], ramoIds[2], 1],
      [alumnos[2][0], ramoIds[2], 1],
      [alumnos[4][0], ramoIds[2], 1],
    ];

    let inscripcionesCount = 0;
    for (const [rutAlumno, ramoId, numSeccion] of alumnoSeccionData) {
      const seccionResult = await query(
        `SELECT id FROM seccion WHERE id_ramo = $1 AND numero_seccion = $2`,
        [ramoId, numSeccion]
      );
      
      if (seccionResult.rows.length > 0) {
        const seccionId = seccionResult.rows[0].id;
        await query(
          `INSERT INTO alumno_seccion (rut_alumno, id_seccion) VALUES ($1, $2)`,
          [rutAlumno, seccionId]
        );
        inscripcionesCount++;
      }
    }
    log.success(`${inscripcionesCount} Alumnos inscritos en secciones\n`);

    // ============= CREAR TIPOS DE EVENTOS =============
    log.info('Creando tipos de eventos...');
    
    const tiposEventos = [
      { nombre: 'Evaluación Teórica', color: '#FF6B6B' },
      { nombre: 'Evaluación Práctica', color: '#4ECDC4' },
      { nombre: 'Proyecto', color: '#45B7D1' },
      { nombre: 'Examen Final', color: '#FFA07A' },
    ];

    const tipoEventoIds = [];
    for (const tipo of tiposEventos) {
      const result = await query(
        `INSERT INTO tipos_eventos (nombre, color) VALUES ($1, $2) RETURNING id`,
        [tipo.nombre, tipo.color]
      );
      tipoEventoIds.push(result.rows[0].id);
    }
    log.success(`${tiposEventos.length} Tipos de eventos creados\n`);

    // ============= CREAR EVENTOS Y EVALUACIONES =============
    log.info('Creando eventos y evaluaciones...');
    
    const today = new Date();
    const evaluacionesData = [
      {
        ramoId: ramoIds[0],
        titulo: 'Evaluación 1 - Variables y Operadores',
        tipo: tipoEventoIds[0],
        profesor: profesores[0][0],
        fechaProgramada: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 días
        duracion: 90,
        seccion: 1
      },
      {
        ramoId: ramoIds[0],
        titulo: 'Evaluación 2 - Funciones',
        tipo: tipoEventoIds[0],
        profesor: profesores[0][0],
        fechaProgramada: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 días
        duracion: 90,
        seccion: 1
      },
      {
        ramoId: ramoIds[1],
        titulo: 'Evaluación 1 - POO Básico',
        tipo: tipoEventoIds[1],
        profesor: profesores[2][0],
        fechaProgramada: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días
        duracion: 120,
        seccion: 1
      },
    ];

    const eventosIds = [];
    const evaluacionesIds = [];

    for (const evalData of evaluacionesData) {
      // Crear evento
      const eventoResult = await query(
        `INSERT INTO evento (nombre, descripcion, id_tipo_evento, rut_profesor, fecha_programada, duracion_minutos)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [evalData.titulo, `Evaluación de ${evalData.titulo}`, evalData.tipo, evalData.profesor, evalData.fechaProgramada, evalData.duracion]
      );
      const eventoId = eventoResult.rows[0].id;
      eventosIds.push(eventoId);

      // Crear evaluación
      const evalResult = await query(
        `INSERT INTO evaluaciones (id_evento, id_ramo, nombre, descripcion, tipo_evaluacion)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [eventoId, evalData.ramoId, evalData.titulo, `Evaluación de ${evalData.titulo}`, 'parcial']
      );
      const evaluacionId = evalResult.rows[0].id;
      evaluacionesIds.push(evaluacionId);
    }
    log.success(`${evaluacionesData.length} Eventos y Evaluaciones creados\n`);

    // ============= CREAR SLOTS =============
    log.info('Creando slots...');
    
    let slotsCount = 0;
    for (const eventoId of eventosIds) {
      const slotCount = Math.floor(Math.random() * 3) + 2; // 2-4 slots por evento
      for (let i = 0; i < slotCount; i++) {
        const hora = 8 + i * 2; // 8:00, 10:00, 12:00
        const horaInicio = `${String(hora).padStart(2, '0')}:00:00`;
        
        await query(
          `INSERT INTO slot (id_evento, numero_slot, hora_inicio, estado)
           VALUES ($1, $2, $3, $4)`,
          [eventoId, i + 1, horaInicio, 'disponible']
        );
        slotsCount++;
      }
    }
    log.success(`${slotsCount} Slots creados\n`);

    // ============= INSCRIBIR ALUMNOS EN SLOTS =============
    log.info('Inscribiendo alumnos en slots...');
    
    const slotsResult = await query(`
      SELECT s.id, e.id_ramo FROM slot s 
      JOIN evento e ON s.id_evento = e.id
      LIMIT 20
    `);

    let inscripcionSlotsCount = 0;
    for (let i = 0; i < Math.min(alumnos.length, slotsResult.rows.length); i++) {
      const slot = slotsResult.rows[i];
      const alumno = alumnos[i % alumnos.length];

      try {
        await query(
          `INSERT INTO inscripcion_slot (rut_alumno, id_slot) VALUES ($1, $2)`,
          [alumno[0], slot.id]
        );
        inscripcionSlotsCount++;
      } catch (err) {
        // Ignorar si el alumno ya está inscrito
      }
    }
    log.success(`${inscripcionSlotsCount} Alumnos inscritos en slots\n`);

    // ============= CREAR PAUTAS DE EVALUACIÓN =============
    log.info('Creando pautas de evaluación...');
    
    let pautasCount = 0;
    for (const evaluacionId of evaluacionesIds) {
      const pautaResult = await query(
        `INSERT INTO pauta (id_evaluacion, nombre, descripcion, puntaje_total)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [evaluacionId, 'Pauta de Evaluación', 'Rúbrica de evaluación estándar', 100]
      );
      const pautaId = pautaResult.rows[0].id;

      // Agregar criterios
      const criterios = [
        { nombre: 'Conceptos', puntaje: 30 },
        { nombre: 'Aplicación', puntaje: 35 },
        { nombre: 'Presentación', puntaje: 20 },
        { nombre: 'Participación', puntaje: 15 },
      ];

      for (const criterio of criterios) {
        await query(
          `INSERT INTO pauta_puntajes (id_pauta, nombre_criterio, puntaje_maximo)
           VALUES ($1, $2, $3)`,
          [pautaId, criterio.nombre, criterio.puntaje]
        );
      }
      pautasCount++;
    }
    log.success(`${pautasCount} Pautas de evaluación creadas\n`);

    // ============= CREAR RETROALIMENTACIONES =============
    log.info('Creando retroalimentaciones...');
    
    let retroalimentacionesCount = 0;
    for (const evalId of evaluacionesIds.slice(0, 2)) {
      for (let i = 0; i < 3; i++) {
        const alumno = alumnos[i];
        const profesor = profesores[Math.floor(Math.random() * profesores.length)];
        
        await query(
          `INSERT INTO retroalimentaciones (rut_alumno, rut_profesor, id_evaluacion, contenido, fecha_creacion)
           VALUES ($1, $2, $3, $4, $5)`,
          [alumno[0], profesor[0], evalId, `Buena ejecución. Trabaja en la presentación.`, new Date()]
        );
        retroalimentacionesCount++;
      }
    }
    log.success(`${retroalimentacionesCount} Retroalimentaciones creadas\n`);

    // ============= CREAR BLOQUEOS =============
    log.info('Creando bloqueos de calendario...');
    
    const bloqueos = [
      { fecha: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), razon: 'Vacaciones semestre' },
      { fecha: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), razon: 'Semana de exámenes' },
      { fecha: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), razon: 'Receso académico' },
    ];

    for (const bloqueo of bloqueos) {
      await query(
        `INSERT INTO bloqueo_profesor (rut_profesor, fecha_inicio, fecha_fin, razon)
         VALUES ($1, $2, $3, $4)`,
        [profesores[0][0], bloqueo.fecha, bloqueo.fecha, bloqueo.razon]
      );
    }
    log.success(`${bloqueos.length} Bloqueos creados\n`);

    // ============= ESTADÍSTICAS FINALES =============
    log.info('===== PRECARGA COMPLETADA =====\n');
    log.success('Datos de prueba creados exitosamente:\n');
    console.log(`  👤 Usuarios: ${1 + 1 + profesores.length + alumnos.length}`);
    console.log(`  📚 Ramos: ${ramos.length}`);
    console.log(`  📋 Secciones: ${seccionesData.length}`);
    console.log(`  👥 Alumnos inscritos en secciones: ${inscripcionesCount}`);
    console.log(`  📅 Eventos: ${eventosIds.length}`);
    console.log(`  🎯 Slots: ${slotsCount}`);
    console.log(`  📝 Pautas: ${pautasCount}`);
    console.log(`  💬 Retroalimentaciones: ${retroalimentacionesCount}`);
    console.log(`  🔒 Bloqueos: ${bloqueos.length}\n`);

    log.info('Credenciales de prueba:');
    console.log(`  Admin:     RUT: 11111111-1, Contraseña: admin123`);
    console.log(`  Jefe:      RUT: 22222222-2, Contraseña: jefe123`);
    console.log(`  Profesor:  RUT: 33333333-3, Contraseña: profesor123`);
    console.log(`  Alumno:    RUT: 77777777-7, Contraseña: alumno123\n`);

    process.exit(0);

  } catch (error) {
    log.error(`Error durante la precarga: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar seed
seed();
