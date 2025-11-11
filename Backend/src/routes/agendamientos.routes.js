import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import { findScheduleConflict, getConflictErrorMessage } from '../utils/conflictValidator.js';

const router = express.Router();

// Almacenamiento temporal en memoria para agendamientos entre profesores
let agendamientos = [];
let agendamientoIdCounter = 1;

// Función para ocultar IDs internos
const ocultarIdInterno = (agendamiento) => {
  const { id, profesor_id, ...resto } = agendamiento;
  return resto;
};

// GET - Listar agendamientos
router.get('/', authMiddleware, (req, res) => {
  try {
    let agendamientosFiltered = agendamientos;

    // Si es profesor, solo ve sus agendamientos (como creador o invitado)
    if (req.user.role === 'profesor') {
      agendamientosFiltered = agendamientos.filter(a => 
        a.profesor_id === req.user.id || a.invitados?.includes(req.user.id)
      );
    }
    // Si es coordinador o jefe_carrera, ve todos

    const datosPublicos = agendamientosFiltered.map(agendamiento => ({
      ...ocultarIdInterno(agendamiento),
      agendamiento_id: agendamiento.id
    }));

    console.log(`[OK] GET /api/agendamientos - Usuario: ${req.user.email} (${req.user.role}) - Agendamientos encontrados: ${datosPublicos.length}`);

    res.json({ 
      success: true, 
      message: 'Listando agendamientos',
      total: datosPublicos.length,
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/agendamientos:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al listar agendamientos',
      error: error.message
    });
  }
});

// POST - Crear nuevo agendamiento
router.post('/', 
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const { titulo, descripcion, start_time, end_time, invitados, location } = req.body;

      // Validar campos requeridos
      if (!titulo || !start_time || !end_time) {
        console.warn(`[WARN] POST /api/agendamientos - Datos incompletos`);
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: titulo, start_time, end_time'
        });
      }

      // Validar que start_time sea menor que end_time
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      if (startDate >= endDate) {
        console.warn(`[WARN] POST /api/agendamientos - Horario inválido (start >= end)`);
        return res.status(400).json({
          success: false,
          message: 'La hora de inicio debe ser menor que la hora de fin'
        });
      }

      // Validar conflictos de horario con los eventos del profesor
      const conflict = findScheduleConflict(
        req.user.id,
        start_time,
        end_time,
        agendamientos
      );

      if (conflict) {
        const errorMessage = getConflictErrorMessage(conflict);
        console.warn(`[WARN] POST /api/agendamientos - Conflicto de horario para ${req.user.email}: ${errorMessage}`);
        return res.status(409).json({
          success: false,
          message: errorMessage,
          conflict: conflict
        });
      }

      // Crear el agendamiento
      const nuevoAgendamiento = {
        id: agendamientoIdCounter++,
        titulo,
        descripcion: descripcion || '',
        start_time,
        end_time,
        location: location || '',
        profesor_id: req.user.id,
        invitados: invitados || [],
        estado: 'confirmado',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      agendamientos.push(nuevoAgendamiento);

      const datosPublicos = {
        ...ocultarIdInterno(nuevoAgendamiento),
        agendamiento_id: nuevoAgendamiento.id
      };

      console.log(`[OK] POST /api/agendamientos - Agendamiento creado por ${req.user.email} - ID: ${nuevoAgendamiento.id} - Título: "${nuevoAgendamiento.titulo}"`);

      res.status(201).json({ 
        success: true, 
        message: 'Agendamiento creado exitosamente',
        data: datosPublicos 
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en POST /api/agendamientos:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al crear agendamiento',
        error: error.message
      });
    }
  }
);

// GET - Obtener un agendamiento específico
router.get('/:agendamientoId', authMiddleware, (req, res) => {
  try {
    const agendamiento = agendamientos.find(a => a.id === parseInt(req.params.agendamientoId));
    
    if (!agendamiento) {
      console.warn(`[WARN] GET /api/agendamientos/${req.params.agendamientoId} - Agendamiento no encontrado`);
      return res.status(404).json({
        success: false,
        message: `Agendamiento no encontrado`
      });
    }

    // Verificar permisos: solo el propietario o invitados, coordinador o jefe_carrera
    if (req.user.role === 'profesor' && 
        agendamiento.profesor_id !== req.user.id && 
        !agendamiento.invitados?.includes(req.user.id)) {
      console.warn(`[WARN] GET /api/agendamientos/${req.params.agendamientoId} - ${req.user.email} intentó acceder a agendamiento sin permiso`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este agendamiento'
      });
    }
    
    const datosPublicos = {
      ...ocultarIdInterno(agendamiento),
      agendamiento_id: agendamiento.id
    };

    console.log(`[OK] GET /api/agendamientos/${req.params.agendamientoId} - Agendamiento encontrado por ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Agendamiento encontrado',
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/agendamientos/${req.params.agendamientoId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener agendamiento',
      error: error.message
    });
  }
});

// PUT - Actualizar agendamiento
router.put('/:agendamientoId',
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const agendamiento = agendamientos.find(a => a.id === parseInt(req.params.agendamientoId));
      
      if (!agendamiento) {
        console.warn(`[WARN] PUT /api/agendamientos/${req.params.agendamientoId} - Agendamiento no encontrado`);
        return res.status(404).json({
          success: false,
          message: `Agendamiento no encontrado`
        });
      }

      // Solo el propietario, coordinador o jefe_carrera pueden actualizar
      if (req.user.role === 'profesor' && agendamiento.profesor_id !== req.user.id) {
        console.warn(`[WARN] PUT /api/agendamientos/${req.params.agendamientoId} - ${req.user.email} intentó actualizar agendamiento de otro profesor`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este agendamiento'
        });
      }

      // Validar conflictos de horario si se actualizan start_time o end_time
      if (req.body.start_time || req.body.end_time) {
        const startTime = req.body.start_time || agendamiento.start_time;
        const endTime = req.body.end_time || agendamiento.end_time;

        // Validar que start_time sea menor que end_time
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (startDate >= endDate) {
          console.warn(`[WARN] PUT /api/agendamientos/${req.params.agendamientoId} - Horario inválido`);
          return res.status(400).json({
            success: false,
            message: 'La hora de inicio debe ser menor que la hora de fin'
          });
        }

        const conflict = findScheduleConflict(
          req.user.id,
          startTime,
          endTime,
          agendamientos,
          agendamiento.id
        );

        if (conflict) {
          const errorMessage = getConflictErrorMessage(conflict);
          console.warn(`[WARN] PUT /api/agendamientos/${req.params.agendamientoId} - Conflicto de horario: ${errorMessage}`);
          return res.status(409).json({
            success: false,
            message: errorMessage,
            conflict: conflict
          });
        }
      }
      
      const agendamientoActualizado = {
        ...agendamiento,
        ...req.body,
        updated_at: new Date().toISOString()
      };
      
      const index = agendamientos.findIndex(a => a.id === parseInt(req.params.agendamientoId));
      agendamientos[index] = agendamientoActualizado;
      
      const datosPublicos = {
        ...ocultarIdInterno(agendamientoActualizado),
        agendamiento_id: agendamientoActualizado.id
      };

      console.log(`[OK] PUT /api/agendamientos/${req.params.agendamientoId} - Agendamiento actualizado por ${req.user.email}`);

      res.json({ 
        success: true, 
        message: 'Agendamiento actualizado exitosamente',
        data: datosPublicos 
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en PUT /api/agendamientos/${req.params.agendamientoId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar agendamiento',
        error: error.message
      });
    }
  }
);

// DELETE - Eliminar agendamiento
router.delete('/:agendamientoId',
  authMiddleware,
  checkRole(['profesor', 'coordinador', 'jefe_carrera']),
  (req, res) => {
    try {
      const index = agendamientos.findIndex(a => a.id === parseInt(req.params.agendamientoId));
      
      if (index === -1) {
        console.warn(`[WARN] DELETE /api/agendamientos/${req.params.agendamientoId} - Agendamiento no encontrado`);
        return res.status(404).json({
          success: false,
          message: `Agendamiento no encontrado`
        });
      }

      const agendamiento = agendamientos[index];

      // Solo el propietario, coordinador o jefe_carrera pueden eliminar
      if (req.user.role === 'profesor' && agendamiento.profesor_id !== req.user.id) {
        console.warn(`[WARN] DELETE /api/agendamientos/${req.params.agendamientoId} - ${req.user.email} intentó eliminar agendamiento de otro profesor`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este agendamiento'
        });
      }

      const agendamientoEliminado = agendamientos.splice(index, 1)[0];
      
      const datosPublicos = {
        ...ocultarIdInterno(agendamientoEliminado),
        agendamiento_id: agendamientoEliminado.id
      };

      console.log(`[OK] DELETE /api/agendamientos/${req.params.agendamientoId} - Agendamiento eliminado por ${req.user.email}`);

      res.json({ 
        success: true, 
        message: 'Agendamiento eliminado exitosamente',
        data: datosPublicos
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en DELETE /api/agendamientos/${req.params.agendamientoId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar agendamiento',
        error: error.message
      });
    }
  }
);

export default router;
