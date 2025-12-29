// Backend/src/controllers/InscripcionController.js
import InscripcionService from '../services/inscripcionService.js';
import EventoService from '../services/eventoService.js';
import NotificacionService from '../services/notificacionService.js';

class InscripcionController {
  constructor() {
    this.eventoService = new EventoService();
    this.inscripcionService = new InscripcionService(this.eventoService);
    this.notificacionService = new NotificacionService();
  }

  // Inscribir alumno a evento
  inscribirAlumno = async (req, res) => {
    try {
      const alumnoId = req.user.id;
      const alumnoEmail = req.user.email;
      const {
        eventoId,
        slotId,
        parejaAlumnoId,
        parejaAlumnoEmail
      } = req.body;

      if (!eventoId) {
        return res.status(400).json({
          error: 'Se requiere eventoId'
        });
      }

      // Inscribir
      const inscripcion = await this.inscripcionService.inscribirAlumno({
        eventoId,
        alumnoId,
        alumnoEmail,
        slotId,
        parejaAlumnoId,
        parejaAlumnoEmail
      });

      // Obtener evento para notificación
      const evento = await this.eventoService.obtenerEvento(eventoId);

      // Enviar confirmación por email
      await this.notificacionService.notificarInscripcion(inscripcion, evento, alumnoEmail)
        .catch(err => console.error('Error enviando confirmación:', err));

      // Si hay pareja, notificar también
      if (parejaAlumnoEmail) {
        await this.notificacionService.notificarInscripcion(inscripcion, evento, parejaAlumnoEmail)
          .catch(err => console.error('Error enviando confirmación a pareja:', err));
      }

      res.status(201).json({
        mensaje: 'Inscripción exitosa',
        inscripcion: inscripcion.toJSON()
      });
    } catch (error) {
      console.error('Error al inscribir alumno:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Cancelar inscripción
  cancelarInscripcion = async (req, res) => {
    try {
      const { id } = req.params;
      const alumnoId = req.user.id;
      const alumnoEmail = req.user.email;

      const inscripcion = await this.inscripcionService.cancelarInscripcion(id, alumnoId);
      
      // Obtener evento
      const evento = await this.eventoService.obtenerEvento(inscripcion.eventoId);

      // Notificar cancelación
      await this.notificacionService.notificarCancelacion(inscripcion, evento, alumnoEmail)
        .catch(err => console.error('Error enviando notificación de cancelación:', err));

      res.json({
        mensaje: 'Inscripción cancelada exitosamente',
        inscripcion: inscripcion.toJSON()
      });
    } catch (error) {
      console.error('Error al cancelar inscripción:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Obtener inscripciones del alumno
  obtenerInscripcionesAlumno = async (req, res) => {
    try {
      const alumnoId = req.user.id;
      const inscripciones = await this.inscripcionService.obtenerInscripcionesAlumno(alumnoId);

      res.json({
        inscripciones
      });
    } catch (error) {
      console.error('Error al obtener inscripciones:', error);
      res.status(500).json({
        error: 'Error al obtener inscripciones'
      });
    }
  };

  // Obtener calendario del alumno
  obtenerCalendarioAlumno = async (req, res) => {
    try {
      const alumnoId = req.user.id;
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Se requiere fechaInicio y fechaFin'
        });
      }

      const calendario = await this.inscripcionService.obtenerCalendarioAlumno(
        alumnoId,
        new Date(fechaInicio),
        new Date(fechaFin)
      );

      res.json(calendario);
    } catch (error) {
      console.error('Error al obtener calendario:', error);
      res.status(500).json({
        error: 'Error al obtener calendario'
      });
    }
  };

  // Obtener inscripciones de un evento (Profesor)
  obtenerInscripcionesEvento = async (req, res) => {
    try {
      const { eventoId } = req.params;
      
      // Verificar que el evento existe y pertenece al profesor
      const evento = await this.eventoService.obtenerEvento(eventoId);
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      if (evento.profesorId !== req.user.id && req.user.role !== 'jefecarrera') {
        return res.status(403).json({ error: 'No tienes permiso para ver estas inscripciones' });
      }

      const inscripciones = await this.inscripcionService.obtenerInscripcionesEvento(eventoId);

      // Ocultar IDs de alumnos para privacidad
      const inscripcionesSeguras = inscripciones.map(i => ({
        ...i.toJSON(),
        alumnoId: '***OCULTO***',
        parejaAlumnoId: i.parejaAlumnoId ? '***OCULTO***' : null
      }));

      res.json({
        inscripciones: inscripcionesSeguras
      });
    } catch (error) {
      console.error('Error al obtener inscripciones del evento:', error);
      res.status(500).json({
        error: 'Error al obtener inscripciones del evento'
      });
    }
  };

  // Reasignar alumno de sección (Jefe de Carrera)
  reasignarSeccion = async (req, res) => {
    try {
      if (req.user.role !== 'jefecarrera') {
        return res.status(403).json({
          error: 'Solo el jefe de carrera puede reasignar secciones'
        });
      }

      const {
        alumnoId,
        ramoId,
        seccionAnterior,
        seccionNueva
      } = req.body;

      if (!alumnoId || !ramoId || !seccionAnterior || !seccionNueva) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios'
        });
      }

      const resultado = await this.inscripcionService.reasignarSeccion(
        alumnoId,
        ramoId,
        seccionAnterior,
        seccionNueva
      );

      res.json(resultado);
    } catch (error) {
      console.error('Error al reasignar sección:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };
}

export default InscripcionController;