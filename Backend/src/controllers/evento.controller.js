// Backend/src/controllers/EventoController.js
const EventoService = require('../services/eventoService');
const NotificacionService = require('../services/notificacionService');

class EventoController {
  constructor() {
    this.eventoService = new EventoService();
    this.notificacionService = new NotificacionService();
  }

  // Crear evento (Profesor)
  crearEvento = async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        estado,
        fechaInicio,
        fechaFin,
        tipoEvento,
        modalidad,
        linkOnline,
        ramoId,
        seccionId,
        duracionPorAlumno,
        cupoMaximo,
        permiteParejas,
        sala,
        alumnosEmails // Lista de emails para notificar
      } = req.body;

      // Validaciones básicas
      if (!nombre || !fechaInicio || !fechaFin || !tipoEvento || !modalidad || !ramoId || !seccionId) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios'
        });
      }

      // Obtener profesorId del token/sesión
      const profesorId = req.user.id;

      // Crear evento
      const evento = await this.eventoService.crearEvento({
        nombre,
        descripcion,
        estado: estado || 'pendiente',
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tipoEvento,
        modalidad,
        linkOnline,
        ramoId,
        seccionId,
        profesorId,
        duracionPorAlumno,
        cupoMaximo: cupoMaximo || 1,
        permiteParejas: permiteParejas || false,
        sala
      });

      // Si el evento está confirmado y hay alumnos, enviar notificaciones
      if (estado === 'confirmado' && alumnosEmails && alumnosEmails.length > 0) {
        await this.notificacionService.notificarNuevoEvento(evento, alumnosEmails)
          .catch(err => console.error('Error enviando notificaciones:', err));
      }

      res.status(201).json({
        mensaje: 'Evento creado exitosamente',
        evento: evento.toJSON()
      });
    } catch (error) {
      console.error('Error al crear evento:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Actualizar evento (Profesor)
  actualizarEvento = async (req, res) => {
    try {
      const { id } = req.params;
      const profesorId = req.user.id;

      // Verificar que el evento pertenece al profesor
      const eventoExistente = await this.eventoService.obtenerEvento(id);
      if (!eventoExistente) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      if (eventoExistente.profesorId !== profesorId && req.user.role !== 'jefe_carrera') {
        return res.status(403).json({ error: 'No tienes permiso para modificar este evento' });
      }

      const datosActualizacion = { ...req.body };
      
      // Convertir fechas si vienen como strings
      if (datosActualizacion.fechaInicio) {
        datosActualizacion.fechaInicio = new Date(datosActualizacion.fechaInicio);
      }
      if (datosActualizacion.fechaFin) {
        datosActualizacion.fechaFin = new Date(datosActualizacion.fechaFin);
      }

      const eventoActualizado = await this.eventoService.actualizarEvento(id, datosActualizacion);

      res.json({
        mensaje: 'Evento actualizado exitosamente',
        evento: eventoActualizado.toJSON()
      });
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Eliminar evento (Profesor)
  eliminarEvento = async (req, res) => {
    try {
      const { id } = req.params;
      const profesorId = req.user.id;

      // Verificar que el evento pertenece al profesor
      const evento = await this.eventoService.obtenerEvento(id);
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      if (evento.profesorId !== profesorId && req.user.role !== 'jefe_carrera') {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este evento' });
      }

      await this.eventoService.eliminarEvento(id);

      res.json({
        mensaje: 'Evento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Obtener eventos del profesor
  obtenerEventosProfesor = async (req, res) => {
    try {
      const profesorId = req.user.id;
      const { ramoId, estado, fechaInicio, fechaFin } = req.query;

      const filtros = {};
      if (ramoId) filtros.ramoId = ramoId;
      if (estado) filtros.estado = estado;
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin);

      const eventos = await this.eventoService.obtenerEventosProfesor(profesorId, filtros);

      res.json({
        eventos: eventos.map(e => e.toJSON())
      });
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      res.status(500).json({
        error: 'Error al obtener eventos'
      });
    }
  };

  // Obtener eventos disponibles para alumno
  obtenerEventosDisponibles = async (req, res) => {
    try {
      const alumnoId = req.user.id;
      const { ramoId, seccionId } = req.query;

      if (!ramoId || !seccionId) {
        return res.status(400).json({
          error: 'Se requiere ramoId y seccionId'
        });
      }

      const eventos = await this.eventoService.obtenerEventosDisponibles(
        alumnoId,
        ramoId,
        seccionId
      );

      res.json({
        eventos: eventos.map(e => e.toJSON())
      });
    } catch (error) {
      console.error('Error al obtener eventos disponibles:', error);
      res.status(500).json({
        error: 'Error al obtener eventos disponibles'
      });
    }
  };

  // Obtener un evento específico
  obtenerEvento = async (req, res) => {
    try {
      const { id } = req.params;
      const evento = await this.eventoService.obtenerEvento(id);

      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      res.json({
        evento: evento.toJSON()
      });
    } catch (error) {
      console.error('Error al obtener evento:', error);
      res.status(500).json({
        error: 'Error al obtener evento'
      });
    }
  };

  // Agregar día feriado (Jefe de Carrera)
  agregarDiaFeriado = async (req, res) => {
    try {
      if (req.user.role !== 'jefe_carrera') {
        return res.status(403).json({
          error: 'Solo el jefe de carrera puede agregar días feriados'
        });
      }

      const { fecha, descripcion, tipo } = req.body;

      if (!fecha || !descripcion) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios'
        });
      }

      const feriado = await this.eventoService.agregarDiaFeriado({
        fecha: new Date(fecha),
        descripcion,
        tipo: tipo || 'feriado',
        createdBy: req.user.id
      });

      res.status(201).json({
        mensaje: 'Día feriado agregado exitosamente',
        feriado
      });
    } catch (error) {
      console.error('Error al agregar día feriado:', error);
      res.status(400).json({
        error: error.message
      });
    }
  };

  // Obtener días feriados
  obtenerDiasFeriados = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin);

      const feriados = await this.eventoService.obtenerDiasFeriados(filtros);

      res.json({
        feriados
      });
    } catch (error) {
      console.error('Error al obtener días feriados:', error);
      res.status(500).json({
        error: 'Error al obtener días feriados'
      });
    }
  };
}

export default Evento;
