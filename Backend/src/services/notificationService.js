// Backend/src/services/NotificacionService.js
const nodemailer = require('nodemailer');

class NotificacionService {
  constructor() {
    // Configurar transporter de nodemailer
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Enviar email a un destinatario
  async enviarEmail({ destinatario, asunto, contenido, html }) {
    try {
      const mailOptions = {
        from: `"Sistema de Gestión ISW" <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: asunto,
        text: contenido,
        html: html || this.generarHtmlBasico(contenido)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar email:', error);
      throw new Error('No se pudo enviar el email');
    }
  }

  // Enviar notificación de nuevo evento a alumnos
  async notificarNuevoEvento(evento, alumnosEmails) {
    const asunto = `Nuevo evento disponible: ${evento.nombre}`;
    const contenido = `
Se ha creado un nuevo evento para inscripción:

Nombre: ${evento.nombre}
Descripción: ${evento.descripcion}
Fecha: ${evento.fechaInicio.toLocaleString('es-CL')}
Modalidad: ${evento.modalidad}
${evento.modalidad === 'online' ? `Link: ${evento.linkOnline}` : `Sala: ${evento.sala}`}
Cupos disponibles: ${evento.cupoDisponible}

Por favor, ingresa al sistema para inscribirte.
    `.trim();

    const html = this.generarHtmlEvento(evento);

    const promesas = alumnosEmails.map(email => 
      this.enviarEmail({ destinatario: email, asunto, contenido, html })
        .catch(err => console.error(`Error enviando a ${email}:`, err))
    );

    await Promise.all(promesas);
    return { enviados: alumnosEmails.length };
  }

  // Notificar confirmación de inscripción
  async notificarInscripcion(inscripcion, evento, alumnoEmail) {
    const asunto = `Confirmación de inscripción: ${evento.nombre}`;
    const contenido = `
Tu inscripción ha sido confirmada:

Evento: ${evento.nombre}
Horario asignado: ${inscripcion.horarioAsignado.inicio.toLocaleString('es-CL')} - ${inscripcion.horarioAsignado.fin.toLocaleString('es-CL')}
Modalidad: ${evento.modalidad}
${evento.modalidad === 'online' ? `Link: ${evento.linkOnline}` : `Sala: ${evento.sala}`}

Recuerda llegar a tiempo a tu evaluación.
    `.trim();

    const html = this.generarHtmlInscripcion(inscripcion, evento);

    return await this.enviarEmail({ destinatario: alumnoEmail, asunto, contenido, html });
  }

  // Notificar cancelación de inscripción
  async notificarCancelacion(inscripcion, evento, alumnoEmail) {
    const asunto = `Cancelación de inscripción: ${evento.nombre}`;
    const contenido = `
Tu inscripción ha sido cancelada:

Evento: ${evento.nombre}
Horario que tenías: ${inscripcion.horarioAsignado.inicio.toLocaleString('es-CL')} - ${inscripcion.horarioAsignado.fin.toLocaleString('es-CL')}

Puedes volver a inscribirte si hay cupos disponibles.
    `.trim();

    return await this.enviarEmail({ destinatario: alumnoEmail, asunto, contenido });
  }

  // Enviar recordatorio antes del evento
  async enviarRecordatorio(inscripcion, evento, alumnoEmail, horasAntes = 24) {
    const asunto = `Recordatorio: ${evento.nombre} - Mañana`;
    const contenido = `
Recordatorio de tu evento programado:

Evento: ${evento.nombre}
Horario: ${inscripcion.horarioAsignado.inicio.toLocaleString('es-CL')} - ${inscripcion.horarioAsignado.fin.toLocaleString('es-CL')}
Modalidad: ${evento.modalidad}
${evento.modalidad === 'online' ? `Link: ${evento.linkOnline}` : `Sala: ${evento.sala}`}

Recuerda prepararte para tu evaluación.
    `.trim();

    const html = this.generarHtmlRecordatorio(inscripcion, evento, horasAntes);

    return await this.enviarEmail({ destinatario: alumnoEmail, asunto, contenido, html });
  }

  // Generar HTML básico
  generarHtmlBasico(contenido) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Sistema de Gestión ISW</h2>
    </div>
    <div class="content">
      <pre style="white-space: pre-wrap;">${contenido}</pre>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Generar HTML para evento
  generarHtmlEvento(evento) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
    .evento-info { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .label { font-weight: bold; color: #555; }
    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎓 Nuevo Evento Disponible</h2>
    </div>
    <div class="content">
      <div class="evento-info">
        <p><span class="label">Nombre:</span> ${evento.nombre}</p>
        <p><span class="label">Descripción:</span> ${evento.descripcion}</p>
        <p><span class="label">Fecha:</span> ${evento.fechaInicio.toLocaleString('es-CL')}</p>
        <p><span class="label">Modalidad:</span> ${evento.modalidad === 'online' ? '💻 Online' : '🏫 Presencial'}</p>
        ${evento.modalidad === 'online' ? 
          `<p><span class="label">Link:</span> <a href="${evento.linkOnline}">${evento.linkOnline}</a></p>` :
          `<p><span class="label">Sala:</span> ${evento.sala}</p>`
        }
        <p><span class="label">Cupos disponibles:</span> ${evento.cupoDisponible}</p>
      </div>
      <p>Por favor, ingresa al sistema para inscribirte lo antes posible.</p>
    </div>
    <div class="footer">
      <p>Sistema de Gestión ISW - Universidad</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Generar HTML para inscripción
  generarHtmlInscripcion(inscripcion, evento) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
    .confirmacion { background: #e8f5e9; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
    .label { font-weight: bold; color: #555; }
    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Inscripción Confirmada</h2>
    </div>
    <div class="content">
      <div class="confirmacion">
        <h3>${evento.nombre}</h3>
        <p><span class="label">Tu horario:</span> ${inscripcion.horarioAsignado.inicio.toLocaleString('es-CL')} - ${inscripcion.horarioAsignado.fin.toLocaleString('es-CL')}</p>
        <p><span class="label">Modalidad:</span> ${evento.modalidad === 'online' ? '💻 Online' : '🏫 Presencial'}</p>
        ${evento.modalidad === 'online' ? 
          `<p><span class="label">Link:</span> <a href="${evento.linkOnline}">${evento.linkOnline}</a></p>` :
          `<p><span class="label">Sala:</span> ${evento.sala}</p>`
        }
      </div>
      <p><strong>Importante:</strong> Recuerda llegar a tiempo a tu evaluación.</p>
    </div>
    <div class="footer">
      <p>Sistema de Gestión ISW - Universidad</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Generar HTML para recordatorio
  generarHtmlRecordatorio(inscripcion, evento, horasAntes) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
    .recordatorio { background: #fff3e0; padding: 15px; margin: 10px 0; border-left: 4px solid #FF9800; }
    .label { font-weight: bold; color: #555; }
    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⏰ Recordatorio de Evento</h2>
    </div>
    <div class="content">
      <div class="recordatorio">
        <p>Tu evento es en ${horasAntes} horas</p>
        <h3>${evento.nombre}</h3>
        <p><span class="label">Horario:</span> ${inscripcion.horarioAsignado.inicio.toLocaleString('es-CL')} - ${inscripcion.horarioAsignado.fin.toLocaleString('es-CL')}</p>
        <p><span class="label">Modalidad:</span> ${evento.modalidad === 'online' ? '💻 Online' : '🏫 Presencial'}</p>
        ${evento.modalidad === 'online' ? 
          `<p><span class="label">Link:</span> <a href="${evento.linkOnline}">${evento.linkOnline}</a></p>` :
          `<p><span class="label">Sala:</span> ${evento.sala}</p>`
        }
      </div>
      <p><strong>Prepárate:</strong> Asegúrate de tener todo listo para tu evaluación.</p>
    </div>
    <div class="footer">
      <p>Sistema de Gestión ISW - Universidad</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = NotificacionService;