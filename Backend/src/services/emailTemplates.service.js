/**
 * Servicio de templates HTML para correos de evaluaciones
 * Diseños profesionales y llamativos
 */

// Template 1: Nueva Evaluación - Correo detallado
export const templateEvaluacionNueva = (datos) => {
  const {
    alumnoNombre,
    ramoNombre,
    codigoRamo,
    evaluacionNombre,
    tipoEvaluacion,
    ponderacion,
    fechaProgramada,
    duracion,
    descripcion,
    criterios = [],
    enlaceDetalles = '',
  } = datos;

  const fechaFormato = new Date(fechaProgramada).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { color: #667eea; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .content { background: white; padding: 30px; }
        .alert-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .alert-box h2 { font-size: 18px; margin-bottom: 5px; }
        .datos-principales { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .dato-item { background: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
        .dato-label { font-weight: bold; color: #667eea; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .dato-valor { font-size: 16px; color: #333; }
        .seccion { margin: 25px 0; }
        .seccion-titulo { color: #667eea; font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
        .criterios-list { list-style: none; padding-left: 0; }
        .criterios-list li { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; }
        .criterios-list li:before { content: "✓"; color: #667eea; font-weight: bold; margin-right: 10px; font-size: 16px; }
        .boton { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 10px; font-weight: bold; transition: transform 0.2s; }
        .boton:hover { transform: scale(1.05); }
        .footer { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px; }
        .footer p { margin: 5px 0; }
        .instrucciones { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 15px 0; }
        .instrucciones strong { color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Nueva Evaluación Creada</h1>
          <p>Sistema de Evaluaciones - Notificación Importante</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2>¡Nueva evaluación disponible!</h2>
            <p>Se ha creado una nueva evaluación en tu ramo</p>
          </div>

          <div style="margin-bottom: 20px;">
            <p>Hola <strong>${alumnoNombre}</strong>,</p>
            <p>Te notificamos que se ha agregado una nueva evaluación a tu ramo. Revisa los detalles a continuación:</p>
          </div>

          <div class="datos-principales">
            <div class="dato-item">
              <div class="dato-label">Ramo</div>
              <div class="dato-valor">${ramoNombre} (${codigoRamo})</div>
            </div>
            <div class="dato-item">
              <div class="dato-label">Evaluación</div>
              <div class="dato-valor">${evaluacionNombre}</div>
            </div>
            <div class="dato-item">
              <div class="dato-label">Tipo</div>
              <div class="dato-valor">${tipoEvaluacion}</div>
            </div>
            <div class="dato-item">
              <div class="dato-label">Ponderación</div>
              <div class="dato-valor"><strong>${ponderacion}%</strong></div>
            </div>
          </div>

          ${descripcion ? `
            <div class="seccion">
              <div class="seccion-titulo">📝 Descripción</div>
              <p>${descripcion}</p>
            </div>
          ` : ''}

          ${criterios.length > 0 ? `
            <div class="seccion">
              <div class="seccion-titulo">✓ Criterios de Evaluación</div>
              <ul class="criterios-list">
                ${criterios.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="instrucciones">
            <strong>📅 Importante:</strong> La evaluación está programada para el <strong>${fechaFormato}</strong>.
            ${duracion ? `Se estima una duración de <strong>${duracion} minutos</strong>.` : ''}
          </div>

          <div style="text-align: center;">
            ${enlaceDetalles ? `<a href="${enlaceDetalles}" class="boton">Ver Detalles Completos</a>` : ''}
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 6px;">
            <p style="font-size: 13px; color: #666;">
              <strong>Próximos pasos:</strong><br>
              • Revisa los criterios de evaluación<br>
              • Prepara tu material de estudio<br>
              • Asegúrate de estar disponible en la fecha programada<br>
              • Comunícate con tu profesor si tienes dudas
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Sistema de Evaluaciones</strong></p>
          <p>Este es un correo automático. Por favor, no respondas directamente.</p>
          <p>Si tienes problemas de acceso, contacta al soporte técnico.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template 2: Confirmación de Inscripción en Slot
export const templateInscripcionSlot = (datos) => {
  const {
    alumnoNombre,
    ramoNombre,
    codigoRamo,
    evaluacionNombre,
    fechaSlot,
    horaInicio,
    horaFin,
    sala,
    nombreProfesor,
    instrucciones = '',
    enlaceConfirmacion = '',
  } = datos;

  const fechaFormato = new Date(fechaSlot).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { color: #11998e; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .content { background: white; padding: 30px; }
        .success-badge { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin-bottom: 20px; }
        .horario-box { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .horario-box h2 { font-size: 24px; margin-bottom: 10px; }
        .hora { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .detalles { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .detalle-item { background: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #11998e; }
        .detalle-label { font-weight: bold; color: #11998e; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .detalle-valor { font-size: 16px; color: #333; }
        .checklist { background: #f0fff4; padding: 15px; border-radius: 6px; border-left: 4px solid #38ef7d; margin: 15px 0; }
        .checklist strong { color: #11998e; }
        .checklist ul { list-style: none; margin-left: 0; padding-left: 25px; }
        .checklist li { margin: 8px 0; }
        .checklist li:before { content: "✓"; color: #38ef7d; font-weight: bold; margin-right: 10px; }
        .boton { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 10px; font-weight: bold; transition: transform 0.2s; }
        .boton:hover { transform: scale(1.05); }
        .footer { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Inscripción Confirmada</h1>
          <p>Tu slot para la evaluación ha sido asignado</p>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ INSCRIPCIÓN EXITOSA</div>

          <p style="margin-bottom: 15px;">Hola <strong>${alumnoNombre}</strong>,</p>
          <p style="margin-bottom: 20px;">¡Excelente! Tu inscripción en el slot de evaluación ha sido confirmada. Aquí están los detalles:</p>

          <div class="horario-box">
            <h2>${fechaFormato}</h2>
            <div class="hora">${horaInicio} - ${horaFin}</div>
            <p style="margin-top: 10px; font-size: 14px;">Duración: ${(() => {
              const inicio = new Date('2024-01-01 ' + horaInicio);
              const fin = new Date('2024-01-01 ' + horaFin);
              return Math.round((fin - inicio) / 60000);
            })()} minutos</p>
          </div>

          <div class="detalles">
            <div class="detalle-item">
              <div class="detalle-label">Ramo</div>
              <div class="detalle-valor">${ramoNombre}<br><small>${codigoRamo}</small></div>
            </div>
            <div class="detalle-item">
              <div class="detalle-label">Evaluación</div>
              <div class="detalle-valor">${evaluacionNombre}</div>
            </div>
            ${sala ? `
            <div class="detalle-item">
              <div class="detalle-label">Sala</div>
              <div class="detalle-valor">${sala}</div>
            </div>
            ` : ''}
            ${nombreProfesor ? `
            <div class="detalle-item">
              <div class="detalle-label">Profesor</div>
              <div class="detalle-valor">${nombreProfesor}</div>
            </div>
            ` : ''}
          </div>

          <div class="checklist">
            <strong>📋 Recomendaciones:</strong>
            <ul>
              <li>Llega 10 minutos antes de tu hora asignada</li>
              <li>Trae tu carnet o documento de identidad</li>
              <li>Asegúrate de tener todos los materiales permitidos</li>
              <li>Silencia tu teléfono móvil</li>
            </ul>
          </div>

          ${instrucciones ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 15px 0;">
              <strong style="color: #856404;">📝 Instrucciones Especiales:</strong>
              <p style="margin-top: 10px; color: #666;">${instrucciones}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 20px;">
            ${enlaceConfirmacion ? `<a href="${enlaceConfirmacion}" class="boton">Confirmar Asistencia</a>` : ''}
          </div>
        </div>

        <div class="footer">
          <p><strong>Sistema de Evaluaciones</strong></p>
          <p>Conserva este correo como referencia de tu horario asignado.</p>
          <p>Si necesitas cambiar tu slot, hazlo desde el portal antes de 24 horas.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template 3: Recordatorio de Evaluación Próxima
export const templateRecordatorioEvaluacion = (datos) => {
  const {
    alumnoNombre,
    ramoNombre,
    codigoRamo,
    evaluacionNombre,
    fechaEvaluacion,
    diasRestantes,
    horaEvaluacion,
    descripcionPreparacion = '',
    enlaceEstudio = '',
    tiposPreguntas = [],
  } = datos;

  const fechaFormato = new Date(fechaEvaluacion).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const esHoy = diasRestantes === 0;
  const esManana = diasRestantes === 1;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { color: #f5576c; font-size: 28px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .content { background: white; padding: 30px; }
        .urgencia-box { background: ${esHoy ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8e72 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .urgencia-box h2 { font-size: 20px; margin-bottom: 5px; }
        .countdown { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-card { background: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #f5576c; }
        .info-label { font-weight: bold; color: #f5576c; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .info-valor { font-size: 16px; color: #333; }
        .preparacion-section { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
        .preparacion-section h3 { color: #d84545; margin-bottom: 10px; }
        .consejos { list-style: none; padding: 0; }
        .consejos li { padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.5); display: flex; align-items: center; }
        .consejos li:before { content: "→"; color: #f5576c; font-weight: bold; margin-right: 10px; font-size: 16px; }
        .tipos-preguntas { background: #f0f7ff; padding: 15px; border-radius: 6px; border-left: 4px solid #4a90e2; margin: 15px 0; }
        .tipos-preguntas h4 { color: #4a90e2; margin-bottom: 10px; }
        .tipo-item { display: inline-block; background: white; padding: 8px 15px; border-radius: 20px; margin: 5px; border: 2px solid #4a90e2; color: #4a90e2; font-weight: bold; font-size: 12px; }
        .boton { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 10px; font-weight: bold; transition: transform 0.2s; }
        .boton:hover { transform: scale(1.05); }
        .footer { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Recordatorio de Evaluación</h1>
          <p>${esHoy ? '¡HOY ES EL DÍA!' : esManana ? '¡Mañana es tu evaluación!' : 'Tu evaluación se aproxima'}</p>
        </div>
        
        <div class="content">
          <div class="urgencia-box">
            <h2>${esHoy ? '📍 EVALUACIÓN HOY' : esManana ? '⚠️ EVALUACIÓN MAÑANA' : '📅 EVALUACIÓN PRÓXIMA'}</h2>
            <div class="countdown">
              ${esHoy ? 'ÚLTIMO DÍA' : esManana ? 'En 24 horas' : diasRestantes + (diasRestantes === 1 ? ' día' : ' días')}
            </div>
          </div>

          <p style="margin-bottom: 15px;">Hola <strong>${alumnoNombre}</strong>,</p>
          <p style="margin-bottom: 20px;">Te recordamos que tienes una evaluación próxima. Aquí están los detalles:</p>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Evaluación</div>
              <div class="info-valor">${evaluacionNombre}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Ramo</div>
              <div class="info-valor">${ramoNombre} (${codigoRamo})</div>
            </div>
            <div class="info-card">
              <div class="info-label">Fecha</div>
              <div class="info-valor"><strong>${fechaFormato}</strong></div>
            </div>
            ${horaEvaluacion ? `
            <div class="info-card">
              <div class="info-label">Hora</div>
              <div class="info-valor"><strong>${horaEvaluacion}</strong></div>
            </div>
            ` : ''}
          </div>

          <div class="preparacion-section">
            <h3>📚 Prepárate Ahora</h3>
            <ul class="consejos">
              <li>Revisa todos los temas cubiertos en clase</li>
              <li>Realiza ejercicios prácticos similares</li>
              <li>Consulta tus apuntes y material de estudio</li>
              <li>Duerme bien antes de la evaluación</li>
              <li>Llega con tiempo a la sala de evaluación</li>
            </ul>
          </div>

          ${tiposPreguntas.length > 0 ? `
            <div class="tipos-preguntas">
              <h4>🎯 Tipos de Preguntas</h4>
              <div style="margin-top: 10px;">
                ${tiposPreguntas.map(tipo => `<div class="tipo-item">${tipo}</div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${descripcionPreparacion ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 6px; border-left: 4px solid #4caf50; margin: 15px 0;">
              <strong style="color: #2e7d32;">💡 Consejos de Preparación:</strong>
              <p style="margin-top: 10px; color: #666;">${descripcionPreparacion}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 20px;">
            ${enlaceEstudio ? `<a href="${enlaceEstudio}" class="boton">Acceder a Material de Estudio</a>` : ''}
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fafafa; border-radius: 6px; border: 1px solid #ddd;">
            <p style="font-size: 13px; color: #666; margin-bottom: 8px;">
              <strong>⚡ Último Momento:</strong>
            </p>
            <p style="font-size: 13px; color: #666;">
              ${esHoy ? '¡Buena suerte! Acude con confianza y recuerda: ya estás preparado.' : 
                esManana ? 'Aprovecha hoy para tus últimas repasos. Duerme bien esta noche.' : 
                'Organiza tu tiempo para estudiar de manera efectiva estos días.'}
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Sistema de Evaluaciones</strong></p>
          <p>¡Te deseamos mucho éxito en tu evaluación!</p>
          <p>Si tienes preguntas, contacta a tu profesor.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template 4: Aviso simple (estilo plataforma con caja de aviso)
// Diseño original y parametrizable.
export const templateAvisoPlataforma = (datos) => {
  const {
    platformName = "Plataforma",
    systemName = "Sistema Automatizado de Correos",
    saludo = "¡Hola!",
    introLines = [],
    boxTitle = "Aviso",
    boxItems = [],
    linkUrl = "",
    linkText = "Ver en la plataforma",
    contactEmail = "",
    timestampLabel = "Fecha y hora de la notificación",
    timestampValue = "",
  } = datos || {};

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const linesHtml = (introLines || [])
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#1f2937;">${escapeHtml(l)}</p>`)
    .join("");

  const itemsHtml = (boxItems || [])
    .filter(Boolean)
    .map((it) => `<li style="margin:6px 0;font-size:14px;line-height:1.5;color:#1f2937;">${escapeHtml(it)}</li>`)
    .join("");

  const buttonHtml = linkUrl
    ? `<div style="margin-top:14px;">
         <a href="${escapeHtml(linkUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:700;">${escapeHtml(linkText)}</a>
       </div>`
    : "";

  const contactHtml = contactEmail
    ? `<p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#374151;">Si tienes alguna duda, puedes contactarte al correo <a href="mailto:${escapeHtml(contactEmail)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(contactEmail)}</a>.</p>`
    : "";

  const tsHtml = timestampValue
    ? `<div style="margin-top:16px;font-size:11px;color:#6b7280;text-align:center;">${escapeHtml(timestampLabel)}: ${escapeHtml(timestampValue)}</div>`
    : "";

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(boxTitle)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;width:100%;">
            <tr>
              <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;">
                  <tr>
                    <td style="padding:16px 18px;border-bottom:1px solid #e5e7eb;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-family:Arial, sans-serif;font-size:14px;font-weight:800;color:#111827;">${escapeHtml(platformName)}</td>
                          <td align="right" style="font-family:Arial, sans-serif;font-size:12px;color:#2563eb;">${escapeHtml(systemName)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:22px 18px;font-family:Arial, sans-serif;">
                      <h1 style="margin:0 0 12px 0;font-size:26px;line-height:1.2;color:#111827;">${escapeHtml(saludo)}</h1>
                      ${linesHtml}

                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:8px;">
                        <tr>
                          <td style="padding:14px 14px 10px 14px;">
                            <div style="font-family:Arial, sans-serif;font-size:16px;font-weight:800;color:#0f172a;margin-bottom:8px;">${escapeHtml(boxTitle)}</div>
                            <ul style="margin:0;padding-left:18px;">${itemsHtml}</ul>
                          </td>
                        </tr>
                      </table>

                      ${buttonHtml}
                      ${contactHtml}
                      <p style="margin:18px 0 0 0;font-size:13px;color:#374151;">Atentamente, el equipo de ${escapeHtml(platformName)}.</p>
                      ${tsHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
};
