/**
 * Cron Jobs para Notificaciones Automáticas
 * Ejecuta cada 6 horas para enviar recordatorios
 */

import cron from 'node-cron';
import { AppDataSource } from '../config/configDB.js';
import { Evaluacion } from '../entities/evaluaciones.entity.js';
import { enviarRecordatorioEvaluacion } from '../services/notificacionesConEmail.service.js';
import { Evento } from '../entities/evento.entity.js';

let cronjobs = [];

/**
 * Cron: Recordatorios de evaluaciones (4 días antes y día del certamen)
 */
export const cronEvaluacionesProximas = () => {
  const job = cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ [CRON] Iniciando búsqueda de evaluaciones próximas...');
    
    try {
      const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
      const ahora = new Date();
      
      // Buscar evaluaciones en los próximos 4 días y el día actual
      const hace4Dias = new Date();
      hace4Dias.setDate(hace4Dias.getDate() - 1);
      
      const en4Dias = new Date();
      en4Dias.setDate(en4Dias.getDate() + 4);
      
      const evaluacionesProximas = await evaluacionRepo
        .createQueryBuilder('evaluacion')
        .leftJoinAndSelect('evaluacion.ramo', 'ramo')
        .leftJoinAndSelect('ramo.secciones', 'seccion')
        .leftJoinAndSelect('seccion.alumnos', 'alumno')
        .where('evaluacion.fechaProgramada BETWEEN :hace4Dias AND :en4Dias', {
          hace4Dias: hace4Dias.toISOString(),
          en4Dias: en4Dias.toISOString(),
        })
        .andWhere('evaluacion.deleted_at IS NULL')
        .getMany();

      if (evaluacionesProximas.length === 0) {
        console.log('✓ No hay evaluaciones próximas en los próximos 4 días');
        return;
      }

      console.log(`📋 Encontradas ${evaluacionesProximas.length} evaluaciones próximas`);

      // Procesar cada evaluación
      for (const evaluacion of evaluacionesProximas) {
        const fechaEval = new Date(evaluacion.fechaProgramada);
        const diasRestantes = Math.floor((fechaEval - ahora) / (1000 * 60 * 60 * 24));

        // Solo enviar recordatorio si es hoy (0 días) o en 4, 3, 2, 1 días
        const diasPermitidos = [0, 1, 2, 3, 4];
        if (!diasPermitidos.includes(diasRestantes)) {
          continue;
        }

        const alumnos = [];
        if (evaluacion.ramo?.secciones?.length) {
          evaluacion.ramo.secciones.forEach((seccion) => {
            if (seccion?.alumnos?.length) {
              seccion.alumnos.forEach((alumno) => {
                alumnos.push(alumno.id);
              });
            }
          });
        }

        // Enviar recordatorio a cada alumno (opcional: hacer batch para mejor performance)
        for (const alumnoId of [...new Set(alumnos)]) {
          try {
            await enviarRecordatorioEvaluacion({
              alumnoId,
              ramoNombre: evaluacion.ramo?.nombre || evaluacion.codigoRamo,
              codigoRamo: evaluacion.codigoRamo,
              evaluacionNombre: evaluacion.titulo,
              fechaEvaluacion: evaluacion.fechaProgramada,
              diasRestantes: Math.max(0, diasRestantes),
              horaEvaluacion: evaluacion.horaInicio || 'Por definir',
            });
          } catch (error) {
            console.error(`❌ Error enviando recordatorio a alumno ${alumnoId}:`, error.message);
          }
        }

        console.log(`✅ Recordatorio enviado para: ${evaluacion.titulo} (${diasRestantes} días)`);
      }

      console.log('✓ Cron de evaluaciones completado\n');
    } catch (error) {
      console.error('❌ Error en cronEvaluacionesProximas:', error.message);
    }
  });

  cronjobs.push(job);
  return job;
};

/**
 * Cron: Recordatorios de eventos próximos (3 días antes)
 */
export const cronEventosProximos = () => {
  const job = cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ [CRON] Iniciando búsqueda de eventos próximos...');

    try {
      const eventoRepo = AppDataSource.getRepository(Evento);
      const ahora = new Date();
      const en3Dias = new Date();
      en3Dias.setDate(en3Dias.getDate() + 3);
      const hace1Dia = new Date();
      hace1Dia.setDate(hace1Dia.getDate() - 1);

      const eventosProximos = await eventoRepo
        .createQueryBuilder('evento')
        .leftJoinAndSelect('evento.ramo', 'ramo')
        .leftJoinAndSelect('ramo.secciones', 'seccion')
        .leftJoinAndSelect('seccion.alumnos', 'alumno')
        .where('evento.fecha_inicio BETWEEN :hace1Dia AND :en3Dias', {
          hace1Dia: hace1Dia.toISOString(),
          en3Dias: en3Dias.toISOString(),
        })
        .andWhere('evento.deleted_at IS NULL')
        .getMany();

      if (eventosProximos.length === 0) {
        console.log('✓ No hay eventos próximos en los próximos 3 días');
        return;
      }

      console.log(`📅 Encontrados ${eventosProximos.length} eventos próximos`);

      for (const evento of eventosProximos) {
        const diasRestantes = Math.floor((new Date(evento.fecha_inicio) - ahora) / (1000 * 60 * 60 * 24));
        console.log(`✅ Evento próximo: ${evento.nombre} (${diasRestantes} días)`);
      }

      console.log('✓ Cron de eventos completado\n');
    } catch (error) {
      console.error('❌ Error en cronEventosProximos:', error.message);
    }
  });

  cronjobs.push(job);
  return job;
};

/**
 * Cron: Bloqueos próximos (7 días antes)
 */
export const cronBloqueosPróximos = () => {
  const job = cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ [CRON] Iniciando búsqueda de bloqueos próximos...');

    try {
      const ahora = new Date();
      const en7Dias = new Date();
      en7Dias.setDate(en7Dias.getDate() + 7);
      const hace1Dia = new Date();
      hace1Dia.setDate(hace1Dia.getDate() - 1);

      // Aquí iría la lógica de búsqueda de bloqueos
      console.log('✓ Búsqueda de bloqueos próximos ejecutada\n');
    } catch (error) {
      console.error('❌ Error en cronBloqueosPróximos:', error.message);
    }
  });

  cronjobs.push(job);
  return job;
};

/**
 * Inicializa todos los cron jobs
 */
export const initNotificationCrons = () => {
  console.log('\n🚀 Inicializando cron jobs de notificaciones...');
  
  try {
    cronEvaluacionesProximas();
    console.log('✅ Cron de evaluaciones iniciado');
    
    cronEventosProximos();
    console.log('✅ Cron de eventos iniciado');
    
    cronBloqueosPróximos();
    console.log('✅ Cron de bloqueos iniciado');
    
    console.log('🎯 Todos los crons están corriendo cada 6 horas\n');
  } catch (error) {
    console.error('❌ Error inicializando crons:', error.message);
  }
};

/**
 * Detiene todos los cron jobs
 */
export const stopAllCrons = () => {
  console.log('\n⛔ Deteniendo todos los cron jobs...');
  cronjobs.forEach((job, index) => {
    job.stop();
    console.log(`✓ Cron ${index + 1} detenido`);
  });
  cronjobs = [];
  console.log('✓ Todos los crons han sido detenidos\n');
};
