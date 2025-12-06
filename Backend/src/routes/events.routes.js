import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';

const router = express.Router();
import { findScheduleConflict, getConflictErrorMessage } from '../utils/conflictValidator.js';

let eventos = [];
let eventIdCounter = 1;

const ocultarIdInterno = (evento) => {
  const { id, profesor_id, ...resto } = evento;
  return resto;
};

router.get('/', authMiddleware, (req, res) => {
  try {
    let eventosFiltered = eventos;

    if (req.user.role === 'profesor' || req.user.role === 'coordinador') {
      eventosFiltered = eventos.filter(e => e.profesor_id === req.user.id);
    }

    const datosPublicos = eventosFiltered.map(evento => ({
      ...ocultarIdInterno(evento),
      event_id: evento.id
    }));

    console.log(`[OK] GET /api/events - Usuario: ${req.user.email} (${req.user.role}) - Eventos encontrados: ${datosPublicos.length}`);

    res.json({ 
      success: true, 
      message: 'Listando eventos',
      total: datosPublicos.length,
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/events:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al listar eventos',
      error: error.message
    });
  }
});

router.post('/', 
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const nuevoEvento = {
        id: eventIdCounter++,
        ...req.body,
        profesor_id: req.user.id,
        created_at: new Date().toISOString()
      };
      
      eventos.push(nuevoEvento);
      const conflict = findScheduleConflict(
        req.user.id,
        req.body.start_time,
        req.body.end_time,
        eventos,
        nuevoEvento.id
      );
      
      if (conflict) {
        eventos.pop();
        const errorMessage = getConflictErrorMessage(conflict);
        console.warn(`[WARN] POST /api/events - Conflicto de horario para ${req.user.email}: ${errorMessage}`);
        return res.status(409).json({
          success: false,
          message: errorMessage,
          conflict: conflict
        });
      }
      
      const datosPublicos = {
        ...ocultarIdInterno(nuevoEvento),
        event_id: nuevoEvento.id
      };

      console.log(`[OK] POST /api/events - Evento creado por ${req.user.email} - ID: ${nuevoEvento.id} - Título: "${nuevoEvento.title}"`);

      res.status(201).json({ 
        success: true, 
        message: 'Evento creado exitosamente',
        data: datosPublicos 
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en POST /api/events:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al crear evento',
        error: error.message
      });
    }
  }
);

router.get('/:eventId', authMiddleware, (req, res) => {
  try {
    const evento = eventos.find(e => e.id === parseInt(req.params.eventId));
    
    if (!evento) {
      console.warn(`[WARN] GET /api/events/${req.params.eventId} - Evento no encontrado`);
      return res.status(404).json({
        success: false,
        message: `Evento no encontrado`
      });
    }

    if (req.user.role === 'profesor' && evento.profesor_id !== req.user.id) {
      console.warn(`[WARN] GET /api/events/${req.params.eventId} - ${req.user.email} intentó acceder a evento de otro profesor`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este evento'
      });
    }
    
    const datosPublicos = {
      ...ocultarIdInterno(evento),
      event_id: evento.id
    };

    console.log(`[OK] GET /api/events/${req.params.eventId} - Evento encontrado por ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Evento encontrado',
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/events/${req.params.eventId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
});

router.put('/:eventId',
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const evento = eventos.find(e => e.id === parseInt(req.params.eventId));
      
      if (!evento) {
        console.warn(`[WARN] PUT /api/events/${req.params.eventId} - Evento no encontrado`);
        return res.status(404).json({
          success: false,
          message: `Evento no encontrado`
        });
      }

      if (req.user.role === 'profesor' && evento.profesor_id !== req.user.id) {
        console.warn(`[WARN] PUT /api/events/${req.params.eventId} - ${req.user.email} intentó actualizar evento de otro profesor`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este evento'
        });
      }
      
      if (req.body.start_time || req.body.end_time) {
        const startTime = req.body.start_time || evento.start_time;
        const endTime = req.body.end_time || evento.end_time;
        
        const conflict = findScheduleConflict(
          req.user.id,
          startTime,
          endTime,
          eventos,
          evento.id
        );
        
        if (conflict) {
          const errorMessage = getConflictErrorMessage(conflict);
          console.warn(`[WARN] PUT /api/events/${req.params.eventId} - Conflicto de horario para ${req.user.email}: ${errorMessage}`);
          return res.status(409).json({
            success: false,
            message: errorMessage,
            conflict: conflict
          });
        }
      }
      
      const eventoActualizado = {
        ...evento,
        ...req.body,
        updated_at: new Date().toISOString()
      };
      
      const index = eventos.findIndex(e => e.id === parseInt(req.params.eventId));
      eventos[index] = eventoActualizado;
      
      const datosPublicos = {
        ...ocultarIdInterno(eventoActualizado),
        event_id: eventoActualizado.id
      };

      console.log(`[OK] PUT /api/events/${req.params.eventId} - Evento actualizado por ${req.user.email}`);

      res.json({ 
        success: true, 
        message: 'Evento actualizado exitosamente',
        data: datosPublicos 
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en PUT /api/events/${req.params.eventId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar evento',
        error: error.message
      });
    }
  }
);

router.delete('/:eventId',
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const index = eventos.findIndex(e => e.id === parseInt(req.params.eventId));
      
      if (index === -1) {
        console.warn(`[WARN] DELETE /api/events/${req.params.eventId} - Evento no encontrado`);
        return res.status(404).json({
          success: false,
          message: `Evento no encontrado`
        });
      }

      const evento = eventos[index];

      if (req.user.role === 'profesor' && evento.profesor_id !== req.user.id) {
        console.warn(`[WARN] DELETE /api/events/${req.params.eventId} - ${req.user.email} intentó eliminar evento de otro profesor`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este evento'
        });
      }

      const eventoEliminado = eventos.splice(index, 1)[0];
      
      const datosPublicos = {
        ...ocultarIdInterno(eventoEliminado),
        event_id: eventoEliminado.id
      };

      console.log(`[OK] DELETE /api/events/${req.params.eventId} - Evento eliminado por ${req.user.email}`);

      res.json({ 
        success: true, 
        message: 'Evento eliminado exitosamente',
        data: datosPublicos
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en DELETE /api/events/${req.params.eventId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar evento',
        error: error.message
      });
    }
  }
);

export default router;
