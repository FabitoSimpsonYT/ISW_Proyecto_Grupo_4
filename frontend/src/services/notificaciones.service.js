import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiClock, FiRefreshCw } from 'react-icons/fi';
import io from 'socket.io-client';
import api from './root.service';

/**
 * Servicio de Notificaciones - Versión con Socket.IO Real
 * Conecta con el backend para recibir notificaciones en tiempo real
 */

class NotificacionesService {
  constructor() {
    this.notificaciones = [];
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.usuarioId = null;
    this.token = null;
  }

  /**
   * Inicializar Socket.IO con el servidor
   * @param {string} usuarioId - ID del usuario autenticado
   * @param {string} token - JWT token para autenticación
   */
  inicializarWebSocket(usuarioId, token) {
    if (this.socket?.connected) {
      console.log('[Notificaciones] Socket.IO ya conectado');
      return;
    }

    this.usuarioId = usuarioId;
    this.token = token;

    try {
      const socketURL = window.location.origin;
      console.log(`[Notificaciones] Conectando Socket.IO a ${socketURL}`);
      
      this.socket = io(socketURL, {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      // Conectar a sala de notificaciones
      this.socket.on('connect', () => {
        console.log('[Notificaciones] Socket.IO conectado:', this.socket.id);
        this.reconnectAttempts = 0;
        
        // Emitir evento join para registrarse en sala de notificaciones
        this.socket.emit('join-notificaciones', {
          token: token,
          userId: usuarioId,
        });
      });

      // Escuchar notificaciones nuevas
      this.socket.on('notificacion-nueva', (notificacion) => {
        console.log('[Notificaciones] Nueva notificación recibida:', notificacion);
        this.procesarNotificacion(notificacion);
      });

      // Escuchar notificaciones pendientes
      this.socket.on('notificaciones-pendientes', (notificaciones) => {
        console.log('[Notificaciones] Notificaciones pendientes:', notificaciones);
        notificaciones.forEach(notif => this.procesarNotificacion(notif));
      });

      this.socket.on('error', (error) => {
        console.error('[Notificaciones] Error:', error);
      });

      this.socket.on('disconnect', () => {
        console.log('[Notificaciones] Socket.IO desconectado');
      });

    } catch (error) {
      console.error('[Notificaciones] Error al inicializar Socket.IO:', error);
    }
  }

  /**
   * Procesar notificación según su tipo
   */
  procesarNotificacion(notificacion) {
    const { tipo, titulo, mensaje, datos, urgencia } = notificacion;

    console.log('[Notificaciones] Procesando notificación:', tipo);

    switch (tipo) {
      case 'evaluacion.creada':
        this.mostrarNotificacionEvaluacionCreada(notificacion);
        break;
      case 'evaluacion.modificada':
        this.mostrarNotificacionEvaluacionModificada(notificacion);
        break;
      case 'evaluacion.cancelada':
        this.mostrarNotificacionEvaluacionCancelada(notificacion);
        break;
      case 'alumno.inscrito-slot':
        this.mostrarNotificacionInscripcionConfirmada(notificacion);
        break;
      case 'slot.abierto':
        this.mostrarNotificacionSlotAbierto(notificacion);
        break;
      case 'recordatorio.proximo':
        this.mostrarNotificacionRecordatorio(notificacion);
        break;
      case 'cambio.horario-confirmado':
        this.mostrarNotificacionCambioHorario(notificacion);
        break;
      default:
        this.mostrarNotificacionGeneral(notificacion);
    }

    // Guardar en memoria y localStorage
    this.guardarNotificacion(notificacion);
  }

  /**
   * Mostrar toast de evaluación creada
   */
  mostrarNotificacionEvaluacionCreada(notif) {
    const { titulo, mensaje, datos } = notif;
    
    toast.success(
      `✓ ${titulo}\n${datos.titulo}\n📅 ${new Date(datos.fecha).toLocaleDateString()} a las ${datos.horaInicio}`,
      { duration: 6000 }
    );
  }

  /**
   * Mostrar toast de evaluación modificada
   */
  mostrarNotificacionEvaluacionModificada(notif) {
    const { titulo, mensaje, datos } = notif;
    
    toast(
      `⚠️ ${titulo}\n${datos.titulo}`,
      { duration: 6000 }
    );
  }

  /**
   * Mostrar toast de evaluación cancelada
   */
  mostrarNotificacionEvaluacionCancelada(notif) {
    const { titulo, mensaje, datos } = notif;
    
    toast.error(
      `❌ ${titulo}\n${datos.titulo}\nCancelado por el profesor`,
      { duration: 7000 }
    );
  }

  /**
   * Mostrar toast de inscripción confirmada
   */
  mostrarNotificacionInscripcionConfirmada(notif) {
    const { titulo, datos } = notif;
    
    toast.success(
      `✓ ${titulo}\n${datos.titulo}\n🕐 ${datos.horaInicio} - ${datos.horaFin}\n👥 ${datos.inscritos}/${datos.capacidad}`,
      { duration: 6000 }
    );
  }

  /**
   * Mostrar toast de slot abierto
   */
  mostrarNotificacionSlotAbierto(notif) {
    const { titulo, datos } = notif;
    
    toast(
      `🔔 ${titulo}\n${datos.titulo}\n📅 ${new Date(datos.fecha).toLocaleDateString()}`,
      { duration: 6000 }
    );
  }

  /**
   * Mostrar toast de recordatorio
   */
  mostrarNotificacionRecordatorio(notif) {
    const { titulo, datos } = notif;
    
    toast(
      `⏰ ${titulo}\n${datos.titulo}\n${datos.horasRestantes} horas restantes`,
      { duration: 8000 }
    );
  }

  /**
   * Mostrar toast de cambio de horario
   */
  mostrarNotificacionCambioHorario(notif) {
    const { titulo, datos } = notif;
    
    toast(
      `🔄 ${titulo}\nNuevo: ${datos.slotNuevo.horaInicio}\nAnterior: ${datos.slotAnterior.horaInicio}`,
      { duration: 7000 }
    );
  }

  /**
   * Mostrar notificación genérica
   */
  mostrarNotificacionGeneral(notif) {
    const { titulo, mensaje } = notif;
    
    toast(
      `ℹ️ ${titulo}\n${mensaje}`,
      { duration: 5000 }
    );
  }

  /**
   * Notificación: Profesor crea una evaluación
   */
  notificarEvaluacionCreada(evento) {
    const mensaje = `Nueva evaluación: ${evento.titulo} en ${evento.ramo}`;
    
    toast.success(
      `${mensaje}\n${evento.cantidadSlots || 0} slot(s) disponible(s)`,
      { duration: 5000 }
    );

    this.guardarNotificacion({
      tipo: 'evaluacion_creada',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      esAlumno: true,
      datos: evento,
    });
  }

  /**
   * Notificación: Profesor modifica una evaluación
   */
  notificarEvaluacionModificada(evento, cambios) {
    let mensaje = `Cambios en: ${evento.titulo}`;
    let detalles = [];

    if (cambios.nuevosSlots) {
      detalles.push(`${cambios.nuevosSlots} nuevo(s) slot(s)`);
    }
    if (cambios.slotsCancelados) {
      detalles.push(`${cambios.slotsCancelados} slot(s) cancelado(s)`);
    }
    if (cambios.cambiosHora) {
      detalles.push('Cambio de hora');
    }

    toast(
      `${mensaje}\n${detalles.join(', ')}`,
      { duration: 5000 }
    );

    this.guardarNotificacion({
      tipo: 'evaluacion_modificada',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      detalles: cambios,
      esAlumno: true,
      datos: evento,
    });
  }

  /**
   * Notificación: Profesor cancela una evaluación
   */
  notificarEvaluacionCancelada(evento) {
    const mensaje = `Cancelada: ${evento.titulo}`;
    
    toast.error(
      `${mensaje}\n${evento.razon || 'Sin especificar razón'}`,
      { duration: 6000 }
    );

    this.guardarNotificacion({
      tipo: 'evaluacion_cancelada',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      razon: evento.razon,
      esAlumno: true,
      datos: evento,
    });
  }

  /**
   * Notificación: Alumno es inscrito en evaluación por profesor
   */
  notificarAlumnoInscrito(evento, alumno) {
    const mensaje = `¡Inscrito en ${evento.titulo}!`;
    
    toast.success(
      `${mensaje}\n${evento.fecha} a las ${evento.hora}`,
      { duration: 6000 }
    );

    this.guardarNotificacion({
      tipo: 'alumno_inscrito',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      alumnoId: alumno.id,
      esAlumno: true,
      datos: { evento, alumno },
    });
  }

  /**
   * Notificación: Alumno inscrito en slot
   */
  notificarAlumnoInscritoSlot(evento, slot, alumno) {
    const mensaje = `Tu inscripción en ${evento.titulo} fue confirmada`;
    
    toast.success(
      `${mensaje}\n${slot.fecha} ${slot.hora_inicio} - ${slot.hora_fin}\n${slot.ubicacion}`,
      { duration: 6000 }
    );

    this.guardarNotificacion({
      tipo: 'alumno_inscrito_slot',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      slotId: slot.id,
      alumnoId: alumno.id,
      esAlumno: true,
      datos: { evento, slot, alumno },
    });
  }

  /**
   * Notificación: Slot abierto (nuevo cupo disponible)
   */
  notificarSlotAbierto(evento, slot) {
    const mensaje = `Nuevo slot disponible: ${evento.titulo}`;
    
    toast(
      `${mensaje}\n${slot.fecha} ${slot.hora_inicio} - ${slot.hora_fin}`,
      { duration: 5000 }
    );

    this.guardarNotificacion({
      tipo: 'slot_abierto',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      slotId: slot.id,
      esAlumno: true,
      datos: { evento, slot },
    });
  }

  /**
   * Notificación: Slot lleno
   */
  notificarSlotLleno(evento, slot) {
    const mensaje = `Slot lleno: ${evento.titulo}`;
    
    toast(
      `${mensaje}\n${slot.fecha} ${slot.hora_inicio} está lleno`,
      { duration: 4000 }
    );

    this.guardarNotificacion({
      tipo: 'slot_lleno',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      slotId: slot.id,
      esAlumno: true,
      datos: { evento, slot },
    });
  }

  /**
   * Notificación: Recordatorio de evaluación próxima
   */
  notificarRecordatorioProximo(evento, diasRestantes) {
    let mensaje;
    if (diasRestantes === 0) {
      mensaje = `¡Hoy es tu evaluación de ${evento.titulo}!`;
    } else if (diasRestantes === 1) {
      mensaje = `Mañana es tu evaluación de ${evento.titulo}`;
    } else {
      mensaje = `Tu evaluación de ${evento.titulo} es en ${diasRestantes} días`;
    }

    toast(
      `${mensaje}\nHora: ${evento.hora} | Lugar: ${evento.ubicacion}`,
      { duration: 6000 }
    );

    this.guardarNotificacion({
      tipo: 'recordatorio_proximo',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      diasRestantes,
      esAlumno: true,
      datos: evento,
    });
  }

  /**
   * Notificación: Cambios en horario confirmado
   */
  notificarCambioHorarioConfirmado(evento, horarioAnterior, horarioNuevo) {
    const mensaje = `Cambio de horario: ${evento.titulo}`;
    
    toast(
      `${mensaje}\nDe: ${horarioAnterior.fecha} ${horarioAnterior.hora}\nA: ${horarioNuevo.fecha} ${horarioNuevo.hora}`,
      { duration: 6000 }
    );

    this.guardarNotificacion({
      tipo: 'cambio_horario',
      titulo: evento.titulo,
      ramo: evento.ramo,
      mensaje,
      horarioAnterior,
      horarioNuevo,
      esAlumno: true,
      datos: evento,
    });
  }

  /**
   * Notificación: Error en operación
   */
  notificarError(titulo, mensaje) {
    toast.error(`${titulo}\n${mensaje}`, { duration: 5000 });

    this.guardarNotificacion({
      tipo: 'error',
      titulo,
      mensaje,
      esError: true,
    });
  }

  /**
   * Notificación: Éxito en operación
   */
  notificarExito(titulo, mensaje) {
    toast.success(`${titulo}\n${mensaje}`, { duration: 4000 });

    this.guardarNotificacion({
      tipo: 'exito',
      titulo,
      mensaje,
      esExito: true,
    });
  }

  /**
   * Inicializar desde localStorage al cargar la página
   */
  cargarDelLocalStorage() {
    try {
      const datos = localStorage.getItem('notificaciones');
      if (datos) {
        this.notificaciones = JSON.parse(datos);
      }
    } catch (error) {
      console.warn('[Notificaciones] Error cargando del localStorage:', error);
    }
  }

  /**
   * Guardar notificación en memoria
   */
  guardarNotificacion(notificacion) {
    const notifConId = {
      ...notificacion,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      leida: false,
    };
    
    this.notificaciones.push(notifConId);
    
    // Mantener solo las últimas 50
    if (this.notificaciones.length > 50) {
      this.notificaciones.shift();
    }

    // Guardar en localStorage
    try {
      localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
    } catch (error) {
      console.warn('[Notificaciones] Error guardando en localStorage:', error);
    }
  }

  /**
   * Obtener todas las notificaciones del backend
   */
  async obtenerNotificaciones() {
    try {
      const response = await api.get('/notificaciones');
      const notifs = Array.isArray(response.data) ? response.data : response.data?.data || [];
      this.notificaciones = notifs;
      return notifs;
    } catch (error) {
      console.error('[Notificaciones] Error al obtener notificaciones:', error);
      return this.notificaciones; // Fallback a notificaciones en memoria
    }
  }

  /**
   * Obtener notificaciones no leídas
   */
  obtenerNoLeidas() {
    return this.notificaciones.filter(n => !n.leida && !n.vista);
  }

  /**
   * Marcar notificación como leída (deprecated - usar marcarComoVista)
   */
  marcarComoLeida(notificacionId) {
    return this.marcarComoVista(notificacionId);
  }

  /**
   * Marcar notificación como vista en el backend
   */
  async marcarComoVista(notificacionId) {
    try {
      await api.put(`/notificaciones/${notificacionId}/marcar-vista`);
      
      // Actualizar en memoria
      const notif = this.notificaciones.find(n => n.id === notificacionId);
      if (notif) {
        notif.vista = true;
        notif.leida = true;
      }
      
      localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
      return true;
    } catch (error) {
      console.error('[Notificaciones] Error al marcar como vista:', error);
      
      // Actualizar localmente aunque falle el backend
      const notif = this.notificaciones.find(n => n.id === notificacionId);
      if (notif) {
        notif.vista = true;
        notif.leida = true;
        localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
      }
      throw error;
    }
  }

  /**
   * Limpiar notificaciones antiguas (más de 3 horas)
   */
  limpiarAntiguas() {
    const ahoraMs = Date.now();
    const tresHorasMs = 3 * 60 * 60 * 1000;
    
    this.notificaciones = this.notificaciones.filter(n => {
      return (ahoraMs - new Date(n.timestamp).getTime()) < tresHorasMs;
    });

    localStorage.setItem('notificaciones', JSON.stringify(this.notificaciones));
  }

  /**
   * Desconectar Socket.IO
   */
  desconectar() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.usuarioId = null;
    this.token = null;
  }
}

// Exportar singleton
export const notificacionesService = new NotificacionesService();
export default notificacionesService;
