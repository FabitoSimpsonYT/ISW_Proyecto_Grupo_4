/**
 * Servicio de Notificaciones con Email
 * Combina notificaciones en BD con envío de correos
 */

import { notificarEvaluacionNueva, notificarAperturaInscripcion, notificarPautaPublicada, notificarCalificacionesPublicadas, notificarCambioEstadoApelacion, notificarSlotsDisponibles } from './notificacionesRol.service.js';
import { sendEmail } from '../config/email.config.js';
import { templateEvaluacionNueva, templateInscripcionSlot, templateRecordatorioEvaluacion, templateAvisoPlataforma } from './emailTemplates.service.js';
import { AppDataSource } from '../config/configDB.js';
import { User } from '../entities/user.entity.js';

/**
 * Envía notificación + email cuando se crea una nueva evaluación
 */
export const notificarEvaluacionNuevaConEmail = async (datos) => {
  const {
    evaluacionId,
    evaluacionNombre,
    ramoId,
    ramoNombre,
    codigoRamo,
    tipoEvaluacion,
    ponderacion,
    fechaProgramada,
    duracion,
    descripcion,
    criterios = [],
    alumnoIds = [],
  } = datos;

  try {
    // 1. Enviar notificación en BD
    if (alumnoIds.length > 0) {
      await notificarEvaluacionNueva(
        evaluacionId,
        evaluacionNombre,
        ramoNombre,
        fechaProgramada,
        alumnoIds
      );
    }

    // 2. Obtener emails de alumnos
    const userRepo = AppDataSource.getRepository(User);
    const alumnos = await userRepo.find({
      where: alumnoIds.map(id => ({ id })),
      select: ['id', 'email', 'nombres'],
    });

    // 3. Enviar emails a cada alumno
    for (const alumno of alumnos) {
      if (!alumno.email) continue;

      const htmlContent = templateEvaluacionNueva({
        alumnoNombre: alumno.nombres || 'Alumno',
        ramoNombre,
        codigoRamo,
        evaluacionNombre,
        tipoEvaluacion,
        ponderacion,
        fechaProgramada,
        duracion,
        descripcion,
        criterios,
        enlaceDetalles: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/evaluaciones/${evaluacionId}`,
      });

      await sendEmail(
        alumno.email,
        `📋 Nueva Evaluación: ${evaluacionNombre} - ${ramoNombre}`,
        htmlContent
      );
    }

    console.log(`✅ Notificación + Email enviados a ${alumnos.length} alumnos`);
    return { success: true, emailsSent: alumnos.length };
  } catch (error) {
    console.error('❌ Error en notificarEvaluacionNuevaConEmail:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía confirmación cuando un alumno se inscribe en un slot
 */
export const notificarInscripcionSlotConEmail = async (datos) => {
  const {
    alumnoId,
    ramoNombre,
    codigoRamo,
    evaluacionNombre,
    fechaSlot,
    horaInicio,
    horaFin,
    sala,
    nombreProfesor,
    instrucciones = '',
  } = datos;

  try {
    // Obtener datos del alumno
    const userRepo = AppDataSource.getRepository(User);
    const alumno = await userRepo.findOne({
      where: { id: alumnoId },
      select: ['id', 'email', 'nombres'],
    });

    if (!alumno || !alumno.email) {
      console.warn(`⚠️  No se encontró email para alumno ${alumnoId}`);
      return { success: false, error: 'Email no encontrado' };
    }

    // Enviar email de confirmación
    const htmlContent = templateInscripcionSlot({
      alumnoNombre: alumno.nombres || 'Alumno',
      ramoNombre,
      codigoRamo,
      evaluacionNombre,
      fechaSlot,
      horaInicio,
      horaFin,
      sala,
      nombreProfesor,
      instrucciones,
      enlaceConfirmacion: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-evaluaciones`,
    });

    const result = await sendEmail(
      alumno.email,
      `✅ Inscripción Confirmada: ${evaluacionNombre} - ${ramoNombre}`,
      htmlContent
    );

    return { success: result.success, message: 'Email de inscripción enviado' };
  } catch (error) {
    console.error('❌ Error en notificarInscripcionSlotConEmail:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía recordatorio 4 días antes y día del certamen
 */
export const enviarRecordatorioEvaluacion = async (datos) => {
  const {
    alumnoId,
    ramoNombre,
    codigoRamo,
    evaluacionNombre,
    fechaEvaluacion,
    diasRestantes,
    horaEvaluacion,
    descripcionPreparacion = '',
    tiposPreguntas = [],
  } = datos;

  try {
    // Obtener datos del alumno
    const userRepo = AppDataSource.getRepository(User);
    const alumno = await userRepo.findOne({
      where: { id: alumnoId },
      select: ['id', 'email', 'nombres'],
    });

    if (!alumno || !alumno.email) {
      console.warn(`⚠️  No se encontró email para alumno ${alumnoId}`);
      return { success: false, error: 'Email no encontrado' };
    }

    // Generar asunto dinámico según días restantes
    let asunto = '⏰ Recordatorio de Evaluación';
    if (diasRestantes === 0) {
      asunto = '📍 ¡HOY ES TU EVALUACIÓN! - ' + evaluacionNombre;
    } else if (diasRestantes === 1) {
      asunto = '⚠️ MAÑANA: Evaluación de ' + evaluacionNombre;
    } else if (diasRestantes === 4) {
      asunto = '📅 En 4 días: Evaluación de ' + evaluacionNombre;
    }

    // Enviar email con recordatorio
    const htmlContent = templateRecordatorioEvaluacion({
      alumnoNombre: alumno.nombres || 'Alumno',
      ramoNombre,
      codigoRamo,
      evaluacionNombre,
      fechaEvaluacion,
      diasRestantes,
      horaEvaluacion,
      descripcionPreparacion,
      tiposPreguntas,
      enlaceEstudio: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ramos/${codigoRamo}`,
    });

    const result = await sendEmail(alumno.email, asunto, htmlContent);

    const tipoNotificacion = diasRestantes === 0 ? 'EVALUACIÓN HOY' : 
                             diasRestantes === 1 ? 'EVALUACIÓN MAÑANA' : 
                             'RECORDATORIO_EVALUACION';

    console.log(`✅ Recordatorio enviado a ${alumno.email} (${diasRestantes} días antes)`);
    return { success: result.success, tipoNotificacion };
  } catch (error) {
    console.error('❌ Error en enviarRecordatorioEvaluacion:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía notificación de apertura de inscripción
 */
export const notificarAperturaInscripcionConEmail = async (datos) => {
  const {
    evaluacionId,
    evaluacionNombre,
    ramoNombre,
    codigoRamo,
    fechaCierreInscripcion,
    capacidadTotal,
    alumnoIds = [],
    profesorIds = [],
  } = datos;

  try {
    // Enviar notificaciones en BD
    if (alumnoIds.length > 0) {
      await notificarAperturaInscripcion(
        evaluacionId,
        evaluacionNombre,
        ramoNombre,
        alumnoIds,
        profesorIds
      );
    }

    // Obtener emails
    const userRepo = AppDataSource.getRepository(User);
    const usuarios = await userRepo.find({
      where: [...alumnoIds, ...profesorIds].map(id => ({ id })),
      select: ['id', 'email', 'nombres', 'role'],
    });

    // Enviar emails (simplificado)
    for (const usuario of usuarios) {
      if (!usuario.email) continue;

      const htmlContent = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
          <h2 style="color: #667eea;">🎓 Inscripción Abierta</h2>
          <p>Hola ${usuario.nombres || 'Usuario'},</p>
          <p>La inscripción para la evaluación <strong>${evaluacionNombre}</strong> del ramo <strong>${ramoNombre}</strong> ya está disponible.</p>
          <p><strong>Capacidad total:</strong> ${capacidadTotal} estudiantes</p>
          <p><strong>Cierre de inscripción:</strong> ${new Date(fechaCierreInscripcion).toLocaleDateString('es-ES')}</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/evaluaciones/${evaluacionId}" 
               style="background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
              Inscribirse Ahora
            </a>
          </p>
        </div>
      `;

      await sendEmail(
        usuario.email,
        `🎓 Inscripción Abierta: ${evaluacionNombre}`,
        htmlContent
      );
    }

    return { success: true, emailsSent: usuarios.length };
  } catch (error) {
    console.error('❌ Error en notificarAperturaInscripcionConEmail:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía notificación cuando se publica la pauta
 */
export const notificarPautaPublicadaConEmail = async (datos) => {
  const {
    evaluacionId,
    evaluacionNombre,
    ramoNombre,
    codigoRamo,
    alumnoIds = [],
    // Opcionales: para personalizar el mensaje con tus datos
    platformName,
    systemName,
    autorNombre,
    contactEmail,
  } = datos;

  try {
    // Notificación BD
    if (alumnoIds.length > 0) {
      await notificarPautaPublicada(evaluacionId, evaluacionNombre, ramoNombre, alumnoIds);
    }

    // Emails
    const userRepo = AppDataSource.getRepository(User);
    const alumnos = await userRepo.find({
      where: alumnoIds.map(id => ({ id })),
      select: ['email', 'nombres'],
    });

    for (const alumno of alumnos) {
      if (!alumno.email) continue;

      const now = new Date();
      const timestampValue = (() => {
        try {
          return new Intl.DateTimeFormat('es-CL', {
            dateStyle: 'short',
            timeStyle: 'medium',
            timeZone: 'America/Santiago',
          }).format(now);
        } catch {
          return now.toLocaleString('es-CL');
        }
      })();

      const html = templateAvisoPlataforma({
        platformName: platformName || process.env.EMAIL_PLATFORM_NAME || 'Plataforma',
        systemName: systemName || process.env.EMAIL_SYSTEM_NAME || 'Sistema Automatizado de Correos',
        saludo: '¡Hola!',
        introLines: [
          `${alumno.nombres ? alumno.nombres + ',' : ''} te informamos que${autorNombre ? ` ${autorNombre}` : ''} ha publicado la pauta de una evaluación en el ramo "${ramoNombre}".`,
          'Puedes verla a continuación:',
        ],
        boxTitle: 'Pauta publicada',
        boxItems: [
          `Evaluación: ${evaluacionNombre}`,
          `Ramo: ${ramoNombre} (${codigoRamo})`,
        ],
        linkUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ramos/${codigoRamo}`,
        linkText: 'Ver pauta',
        contactEmail: contactEmail || process.env.EMAIL_CONTACT || '',
        timestampValue,
      });

      await sendEmail(alumno.email, `Pauta publicada: ${evaluacionNombre}`, html);
    }

    return { success: true, emailsSent: alumnos.length };
  } catch (error) {
    console.error('❌ Error en notificarPautaPublicadaConEmail:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envía notificación cuando se publican calificaciones
 */
export const notificarCalificacionesPublicadasConEmail = async (datos) => {
  const {
    evaluacionId,
    evaluacionNombre,
    ramoNombre,
    codigoRamo,
    alumnoIds = [],
  } = datos;

  try {
    // Notificación BD
    if (alumnoIds.length > 0) {
      await notificarCalificacionesPublicadas(evaluacionId, evaluacionNombre, ramoNombre, alumnoIds);
    }

    // Emails
    const userRepo = AppDataSource.getRepository(User);
    const alumnos = await userRepo.find({
      where: alumnoIds.map(id => ({ id })),
      select: ['email', 'nombres'],
    });

    for (const alumno of alumnos) {
      if (!alumno.email) continue;

      const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">⭐ Calificaciones Publicadas</h2>
          <p>Hola ${alumno.nombres || 'Alumno'},</p>
          <p>Las calificaciones de <strong>${evaluacionNombre}</strong> en <strong>${ramoNombre}</strong> ya están disponibles.</p>
          <p>Puedes verlas en el portal, en la sección de calificaciones de tus evaluaciones.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-evaluaciones" 
             style="background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 15px;">
            Ver Mis Calificaciones
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Si tienes consultas sobre tu calificación, contacta a tu profesor.</p>
        </div>
      `;

      await sendEmail(alumno.email, `⭐ Calificaciones Publicadas: ${evaluacionNombre}`, html);
    }

    return { success: true, emailsSent: alumnos.length };
  } catch (error) {
    console.error('❌ Error en notificarCalificacionesPublicadasConEmail:', error.message);
    return { success: false, error: error.message };
  }
};
