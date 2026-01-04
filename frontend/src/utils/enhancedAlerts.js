import Swal from 'sweetalert2';
import { getColorByType } from './colorMap.js';

const MySwal = Swal;

/**
 * Configuración base para todas las alertas mejoradas
 * Proporciona un estilo uniforme, formal y con mejor presentación
 */
const baseConfig = {
  allowOutsideClick: false,
  allowEscapeKey: false,
  customClass: {
    container: 'enhanced-alert-container',
    popup: 'enhanced-alert-popup',
    header: 'enhanced-alert-header',
    title: 'enhanced-alert-title',
    htmlContainer: 'enhanced-alert-html',
    confirmButton: 'enhanced-alert-confirm',
    cancelButton: 'enhanced-alert-cancel',
    denyButton: 'enhanced-alert-deny',
  },
  showClass: {
    popup: 'animate-fade-in-up',
    backdrop: 'animate-fade-in'
  },
  hideClass: {
    popup: 'animate-fade-out-down',
    backdrop: 'animate-fade-out'
  },
  width: '550px',
  padding: '0',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  didOpen: (modal) => {
    modal.style.zIndex = '9999';
    // Agregar animaciones
    const popup = modal.querySelector('.swal2-popup');
    if (popup) {
      popup.style.animation = 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
  }
};

/**
 * Estilos CSS inyectados globalmente
 */
const injectStyles = () => {
  if (document.getElementById('enhanced-alerts-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'enhanced-alerts-styles';
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translate(0, -50px);
      }
      to {
        opacity: 1;
        transform: translate(0, 0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translate(0, 0);
      }
      to {
        opacity: 0;
        transform: translate(0, -50px);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .enhanced-alert-container {
      --swal2-text-color: #333;
      --swal2-border-color: #e0e0e0;
    }

    .enhanced-alert-popup {
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .enhanced-alert-header {
      padding: 0;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .enhanced-alert-title {
      margin: 0;
      padding: 30px 30px 20px;
      color: #333;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .enhanced-alert-title-error {
      margin: 0;
      padding: 30px 30px 20px;
      color: #ef4444;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .enhanced-alert-html {
      padding: 25px 30px;
      font-size: 15px;
      color: #444;
      line-height: 1.6;
      max-height: 500px;
      overflow-y: auto;
    }

    .enhanced-alert-html::-webkit-scrollbar {
      width: 6px;
    }

    .enhanced-alert-html::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .enhanced-alert-html::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 10px;
    }

    .enhanced-alert-html::-webkit-scrollbar-thumb:hover {
      background: #764ba2;
    }

    .enhanced-alert-confirm {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border: none !important;
      padding: 12px 32px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 15px !important;
      min-width: 120px !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
    }

    .enhanced-alert-confirm:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6) !important;
    }

    .enhanced-alert-confirm:active {
      transform: translateY(0) !important;
    }

    .enhanced-alert-cancel {
      background: #e0e0e0 !important;
      color: #333 !important;
      border: none !important;
      padding: 12px 32px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 15px !important;
      min-width: 120px !important;
      transition: all 0.3s ease !important;
    }

    .enhanced-alert-cancel:hover {
      background: #d0d0d0 !important;
      transform: translateY(-2px) !important;
    }

    .enhanced-alert-cancel:active {
      transform: translateY(0) !important;
    }

    .enhanced-alert-deny {
      background: #ef4444 !important;
      color: white !important;
      border: none !important;
      padding: 12px 32px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 15px !important;
      min-width: 120px !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
    }

    .enhanced-alert-deny:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.6) !important;
    }

    /* Clase para alertas de éxito */
    .alert-success .enhanced-alert-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .alert-success .enhanced-alert-confirm {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
    }

    .alert-success .enhanced-alert-confirm:hover {
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.6) !important;
    }

    /* Clase para alertas de error */
    .alert-error .enhanced-alert-header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .alert-error .enhanced-alert-confirm {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
    }

    .alert-error .enhanced-alert-confirm:hover {
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.6) !important;
    }

    /* Clase para alertas de advertencia */
    .alert-warning .enhanced-alert-header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .alert-warning .enhanced-alert-confirm {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4) !important;
    }

    .alert-warning .enhanced-alert-confirm:hover {
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.6) !important;
    }

    /* Clase para alertas de información */
    .alert-info .enhanced-alert-header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }

    .alert-info .enhanced-alert-confirm {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
    }

    .alert-info .enhanced-alert-confirm:hover {
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.6) !important;
    }

    /* Estilos para contenido HTML mejorado */
    .alert-content-box {
      margin: 15px 0;
      padding: 16px;
      border-radius: 8px;
      border-left: 5px solid;
      background-size: 100% 100%;
    }

    .alert-content-box.info {
      border-left-color: #667eea;
      background-color: rgba(102, 126, 234, 0.08);
    }

    .alert-content-box.success {
      border-left-color: #10b981;
      background-color: rgba(16, 185, 129, 0.08);
    }

    .alert-content-box.error {
      border-left-color: #ef4444;
      background-color: rgba(239, 68, 68, 0.08);
    }

    .alert-content-box.warning {
      border-left-color: #f59e0b;
      background-color: rgba(245, 158, 11, 0.08);
    }

    .alert-content-title {
      font-weight: 700;
      color: #333;
      font-size: 15px;
      margin: 0 0 8px 0;
    }

    .alert-content-text {
      color: #666;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }

    /* Animaciones para elementos dentro de alertas */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .alert-item {
      animation: fadeInUp 0.3s ease forwards;
    }

    .alert-item:nth-child(1) { animation-delay: 0.05s; }
    .alert-item:nth-child(2) { animation-delay: 0.1s; }
    .alert-item:nth-child(3) { animation-delay: 0.15s; }
    .alert-item:nth-child(4) { animation-delay: 0.2s; }
    .alert-item:nth-child(5) { animation-delay: 0.25s; }
  `;
  
  document.head.appendChild(style);
};

// Inyectar estilos al cargar el módulo
injectStyles();

/**
 * Alerta de éxito mejorada
 */
export const showSuccessAlertEnhanced = (title, message = '', options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'success',
    title: title || '✅ Éxito',
    html: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#10b981',
    customClass: { ...baseConfig.customClass, popup: 'enhanced-alert-popup alert-success' },
    ...options
  });
};

/**
 * Alerta de error mejorada
 */
export const showErrorAlertEnhanced = (title, message = '', options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'error',
    title: title || '❌ Error',
    html: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#ef4444',
    customClass: { ...baseConfig.customClass, popup: 'enhanced-alert-popup alert-error' },
    ...options
  });
};

/**
 * Alerta de advertencia mejorada
 */
export const showWarningAlertEnhanced = (title, message = '', options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'warning',
    title: title || '⚠️ Advertencia',
    html: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#f59e0b',
    showCancelButton: false,
    customClass: { ...baseConfig.customClass, popup: 'enhanced-alert-popup alert-warning' },
    ...options
  });
};

/**
 * Alerta de información mejorada
 */
export const showInfoAlertEnhanced = (title, message = '', options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'info',
    title: title || 'ℹ️ Información',
    html: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#3b82f6',
    customClass: { ...baseConfig.customClass, popup: 'enhanced-alert-popup alert-info' },
    ...options
  });
};

/**
 * Alerta de confirmación mejorada
 */
export const showConfirmAlertEnhanced = (title, message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    icon: 'question',
    title: title || '¿Estás seguro?',
    html: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#667eea',
    cancelButtonColor: '#6c757d',
    customClass: baseConfig.customClass,
    ...options
  });
};

/**
 * Alerta para mostrar detalles de evaluación con más estilo
 */
export const showEvaluationDetailsAlert = (title, htmlContent, options = {}) => {
  return MySwal.fire({
    ...baseConfig,
    title: title,
    html: htmlContent,
    confirmButtonText: 'Cerrar',
    showCancelButton: false,
    customClass: baseConfig.customClass,
    ...options
  });
};

/**
 * Alerta para mostrar detalles de bloqueo con información clara
 */
export const showBlockedDayAlert = (fecha, razon, detallesAdicionales = '', options = {}) => {
  const fechaFormato = fecha.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <div style="text-align: left; font-family: 'Segoe UI', sans-serif;">
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #ef4444;">
        <p style="margin: 0 0 8px 0; color: #ef4444; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📅 Fecha</p>
        <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600; text-transform: capitalize;">${fechaFormato}</p>
      </div>

      <div class="alert-content-box error alert-item">
        <div class="alert-content-title">📌 Razón</div>
        <div class="alert-content-text" style="font-size: 15px; font-weight: 500;">${razon || 'No especificada'}</div>
      </div>
    </div>
  `;

  return MySwal.fire({
    ...baseConfig,
    title: 'Día Bloqueado',
    html: htmlContent,
    icon: 'error',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#ef4444',
    customClass: { 
      ...baseConfig.customClass, 
      popup: 'enhanced-alert-popup alert-error',
      title: 'enhanced-alert-title-error'
    },
    ...options
  });
};

/**
 * Alerta para mostrar evento del calendario
 */
export const showCalendarEventAlert = (evento, options = {}) => {
  const fecha = new Date(evento.fecha || evento.fechaDia);
  const fechaFormato = fecha.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Intentar obtener hora_inicio de múltiples fuentes
  let horaInicio = 'N/A';
  if (evento.hora_inicio) {
    horaInicio = evento.hora_inicio.substring(0, 5);
  } else if (evento.horaInicio) {
    horaInicio = evento.horaInicio.substring(0, 5);
  }
  
  // Intentar obtener hora_fin de múltiples fuentes
  let horaFin = 'N/A';
  if (evento.hora_fin) {
    horaFin = evento.hora_fin.substring(0, 5);
  } else if (evento.horaFin) {
    horaFin = evento.horaFin.substring(0, 5);
  }
  
  // Determinar tipo de evaluación (escrita o por slot)
  const tipoEvaluacion = evento.tipoEvento || evento.tipo_evento || 'Evaluación';
  const esSlot = evento.tipoEvento?.toLowerCase?.().includes('slot') || 
                  evento.tipo_evento?.toLowerCase?.().includes('slot') ||
                  evento.esSlot || 
                  false;
  
  // Para evaluaciones por slot: mostrar fecha/hora de inicio a fecha/hora de fin
  let horarioDisplay = 'N/A';
  
  if (esSlot) {
    // Para slots, mostrar el rango de fechas y horas
    const fechaInicio = new Date(evento.fecha || evento.fechaDia);
    const fechaInicioFormato = fechaInicio.toLocaleString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    
    if (evento.fecha_fin) {
      const fechaFin = new Date(evento.fecha_fin);
      const fechaFinFormato = fechaFin.toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      
      horarioDisplay = `${fechaInicioFormato} ${horaInicio} - ${fechaFinFormato} ${horaFin}`;
    } else {
      horarioDisplay = `${fechaInicioFormato} ${horaInicio} - ${horaFin}`;
    }
  } else {
    // Para evaluaciones escrita: mostrar solo la hora
    horarioDisplay = `${horaInicio} - ${horaFin}`;
  }
  
  // Horario del slot seleccionado por el alumno (si aplica)
  const horarioSlot = evento.hora_slot_inicio && evento.hora_slot_fin 
    ? `${evento.hora_slot_inicio.substring(0, 5)} - ${evento.hora_slot_fin.substring(0, 5)}`
    : null;

  const htmlContent = `
    <div style="text-align: left; font-family: 'Segoe UI', sans-serif; background: #f8f9ff; padding: 24px; border-radius: 12px; border: 2px solid #e0e7ff;">
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #667eea;">
        <p style="margin: 0 0 12px 0; color: #667eea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Detalles</p>
        <h3 style="margin: 0 0 12px 0; color: #1a202c; font-size: 20px; font-weight: 700;">${evento.nombre || evento.titulo || 'Evaluación'}</h3>
        <p style="margin: 0; color: #4a5568; font-size: 14px; text-transform: capitalize;">${fechaFormato}</p>
      </div>

      <!-- Fila 1: Horario, Ramo y Tipo -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">⏰ Horario</p>
          <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${horarioSlot || horarioDisplay}</p>
        </div>

        ${evento.ramo || evento.ramo_nombre ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">📚 Ramo</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${evento.ramo || evento.ramo_nombre}</p>
          </div>
        ` : ''}

        ${evento.tipo || evento.tipo_nombre ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">🎯 Tipo</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${evento.tipo || evento.tipo_nombre}</p>
          </div>
        ` : ''}
      </div>

      <!-- Fila 2: Sección, Sala, Estado, Modalidad -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        ${evento.seccion?.nombre || evento.seccion_nombre ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">👥 Sección</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${evento.seccion?.nombre || evento.seccion_nombre}</p>
          </div>
        ` : ''}

        ${evento.sala ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">🏛️ Sala</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${evento.sala}</p>
          </div>
        ` : ''}

        ${evento.estado || evento.estado_evaluacion ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">📊 Estado</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600; text-transform: capitalize;">${evento.estado || evento.estado_evaluacion}</p>
          </div>
        ` : ''}

        ${evento.modalidad ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">📍 Modalidad</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600; text-transform: capitalize;">${evento.modalidad}</p>
          </div>
        ` : ''}
      </div>

      <!-- Información adicional -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        ${evento.cupo_maximo || evento.cupoMaximo ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">👥 Cupo Máximo</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${evento.cupo_maximo || evento.cupoMaximo} personas</p>
          </div>
        ` : ''}

        ${evento.duracion_minutos || evento.duracionMinutos ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">⏱️ Duración</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${Math.round((evento.duracion_minutos || evento.duracionMinutos) / 60)} horas</p>
          </div>
        ` : ''}

        ${tipoEvaluacion ? `
          <div>
            <p style="margin: 0 0 6px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">📝 Tipo Evaluación</p>
            <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: 600;">${esSlot ? 'Por Slot' : 'Escrita'}</p>
          </div>
        ` : ''}
      </div>

      ${evento.link_online || evento.linkOnline ? `
        <div style="background: #e0f2fe; border: 1px solid #7dd3fc; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; color: #0369a1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">🔗 Enlace Online</p>
          <p style="margin: 0; color: #0369a1; font-size: 13px; word-break: break-all;"><a href="${evento.link_online || evento.linkOnline}" target="_blank" style="color: #0369a1; text-decoration: underline;">${evento.link_online || evento.linkOnline}</a></p>
        </div>
      ` : ''}

      ${evento.descripcion || evento.contenidos || evento.comentario ? `
        <div style="border-top: 2px solid #e0e7ff; padding-top: 20px;">
          <p style="margin: 0 0 12px 0; color: #667eea; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">📄 Descripción / Comentarios</p>
          <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; background: #ffffff; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea;">${evento.descripcion || evento.contenidos || evento.comentario}</p>
        </div>
      ` : ''}
    </div>
  `;

  return MySwal.fire({
    ...baseConfig,
    title: 'Evaluación',
    html: htmlContent,
    confirmButtonText: 'Cerrar',
    showCancelButton: false,
    customClass: baseConfig.customClass,
    width: '700px',
    ...options
  });
};

/**
 * Alerta para mostrar día sin eventos
 */
export const showEmptyDayAlert = (dia, fecha, options = {}) => {
  const fechaFormato = fecha.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
      <div style="margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #667eea;">
        <p style="margin: 0 0 16px 0; color: #667eea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Evaluaciones</p>
        <p style="margin: 0 0 20px 0; color: #333; font-size: 15px; font-weight: 600; text-transform: capitalize;">${fechaFormato}</p>
      </div>

      <div class="alert-content-box info alert-item">
        <div class="alert-content-text" style="font-size: 15px;">No hay evaluaciones programadas. ¡Aprovecha tu tiempo libre!</div>
      </div>
    </div>
  `;

  return MySwal.fire({
    ...baseConfig,
    title: '',
    html: htmlContent,
    icon: 'info',
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#667eea',
    customClass: baseConfig.customClass,
    width: '550px',
    ...options
  });
};

/**
 * Alerta para mostrar múltiples eventos en un día
 */
export const showMultipleEventsAlert = (dia, fecha, eventos, options = {}) => {
  const fechaFormato = fecha.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const mostrarBotones = options.mostrarBotones !== false; // Por defecto mostrar, pero se puede desactivar

  // Mapeo de estados a colores
  const estadoColor = {
    pendiente: '#f59e0b',
    confirmado: '#10b981',
    cancelado: '#ef4444',
    reagendado: '#3b82f6'
  };

  const estadoEmoji = {
    pendiente: '📋',
    confirmado: '✅',
    cancelado: '❌',
    reagendado: '🔄'
  };

  const eventosHtml = eventos.map((ev, idx) => {
    const estado = ev.estado || ev.estado_evaluacion || 'pendiente';
    const estadoColor_ = estadoColor[estado] || '#667eea';
    const tipoEvento = ev.tipo_nombre || ev.tipo || 'Evaluación';
    const descripcion = ev.descripcion || ev.description || '';
    
    // Obtener color dinámico del tipo de evento desde colorMap
    const tipoColor = getColorByType(tipoEvento);
    const colorTypeHex = tipoColor.bg || '#3b82f6';
    
    // Parsear hora de inicio y fin
    let horario = 'N/A';
    if (ev.fecha_inicio) {
      try {
        const inicio = new Date(ev.fecha_inicio);
        const fin = ev.fecha_fin ? new Date(ev.fecha_fin) : null;
        const horaIni = String(inicio.getHours()).padStart(2, '0') + ':' + String(inicio.getMinutes()).padStart(2, '0');
        if (fin) {
          const horaFin = String(fin.getHours()).padStart(2, '0') + ':' + String(fin.getMinutes()).padStart(2, '0');
          horario = `${horaIni} - ${horaFin}`;
        } else {
          horario = horaIni;
        }
      } catch (e) {
        horario = 'N/A';
      }
    }
    
    // Obtener nombre del ramo - puede venir de varios sitios
    const ramoNombre = ev.ramo_nombre || ev.ramo?.nombre || ev.ramo || 'N/A';
    const sala = ev.sala || 'N/A';
    const motivo = ev.comentario || '';

    return `
      <div class="alert-evento-card" data-evento-id="${ev.id}" style="
        margin: 12px 0;
        padding: 16px;
        background: linear-gradient(to bottom, #ffffff, #f9fafb);
        border: 2px solid ${estadoColor_};
        border-left: 6px solid ${colorTypeHex};
        border-radius: 10px;
        position: relative;
        animation: slideIn 0.3s ease-out ${idx * 0.05}s backwards;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #333;">
              ${ev.nombre || ev.titulo}
            </p>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="display: inline-block; padding: 4px 8px; background: ${estadoColor_}; color: white; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                ${estadoEmoji[estado]} ${estado}
              </span>
              <span style="display: inline-block; padding: 4px 8px; background: ${colorTypeHex}; color: white; border-radius: 4px; font-size: 11px; font-weight: 600;">
                🎯 ${tipoEvento}
              </span>
            </div>
          </div>
          ${mostrarBotones ? `
            <div class="evento-botones" style="display: flex; gap: 6px;">
              <button class="btn-editar" data-evento-id="${ev.id}" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
              ">✏️ Editar</button>
              <button class="btn-eliminar" data-evento-id="${ev.id}" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
              ">🗑️ Eliminar</button>
            </div>
          ` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; font-size: 13px;">
          <div>
            <p style="margin: 0; color: #666; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🕒 Horario</p>
            <p style="margin: 4px 0 0 0; color: #333; font-weight: 500;">${horario}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📚 Ramo</p>
            <p style="margin: 4px 0 0 0; color: #333; font-weight: 500;">${ramoNombre}</p>
          </div>
        </div>

        ${descripcion ? `
          <div style="padding: 12px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 12px;">
            <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: 600;">📄 Descripción:</p>
            <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px;">${descripcion}</p>
          </div>
        ` : ''}

        ${motivo ? `
          <div style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-top: 12px;">
            <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600;">📝 Motivo de ${estado}:</p>
            <p style="margin: 4px 0 0 0; color: #b45309; font-size: 13px;">${motivo}</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const htmlContent = `
    <div style="text-align: left; font-family: 'Segoe UI', sans-serif; max-height: 500px; overflow-y: auto; padding-right: 8px;">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #667eea;">
        <p style="margin: 0 0 8px 0; color: #667eea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📋 Evaluaciones del Día</p>
        <p style="margin: 0; color: #333; font-size: 16px; font-weight: 700; text-transform: capitalize;">${fechaFormato}</p>
      </div>
      ${eventosHtml}
    </div>
    <style>
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .btn-editar:hover, .btn-eliminar:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    </style>
  `;

  // Filtrar parámetros personalizados que no deben ir a SweetAlert2
  const { showEditButton, showDeleteButton, onEditar, onEliminar, mostrarBotones: _, ...swalOptions } = options;

  return MySwal.fire({
    ...baseConfig,
    title: '',
    html: htmlContent,
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#667eea',
    customClass: baseConfig.customClass,
    width: '650px',
    didOpen: (modal) => {
      baseConfig.didOpen(modal);
      
      // Agregar event listeners a los botones
      const botonesEditar = modal.querySelectorAll('.btn-editar');
      const botonesEliminar = modal.querySelectorAll('.btn-eliminar');

      botonesEditar.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const eventoId = btn.getAttribute('data-evento-id');
          const evento = eventos.find(e => String(e.id) === String(eventoId));
          if (evento && onEditar) {
            MySwal.close();
            onEditar(evento);
          }
        });
      });

      botonesEliminar.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const eventoId = btn.getAttribute('data-evento-id');
          const evento = eventos.find(e => String(e.id) === String(eventoId));
          console.log('Evento a eliminar:', evento); // Debug
          if (evento && onEliminar) {
            console.log('Ejecutando onEliminar'); // Debug
            onEliminar(evento);
          }
        });
      });
    }
  });
};

/**
 * Alerta de carga/procesamiento
 */
export const showLoadingAlert = (title = 'Cargando...', message = '') => {
  return MySwal.fire({
    ...baseConfig,
    title: title,
    html: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: false,
    showConfirmButton: false,
    didOpen: (modal) => {
      baseConfig.didOpen(modal);
      Swal.showLoading();
    }
  });
};

/**
 * Cierra una alerta de carga
 */
export const closeLoadingAlert = () => {
  MySwal.close();
};

export default {
  showSuccessAlertEnhanced,
  showErrorAlertEnhanced,
  showWarningAlertEnhanced,
  showInfoAlertEnhanced,
  showConfirmAlertEnhanced,
  showEvaluationDetailsAlert,
  showBlockedDayAlert,
  showCalendarEventAlert,
  showEmptyDayAlert,
  showMultipleEventsAlert,
  showLoadingAlert,
  closeLoadingAlert
};
