import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';

const router = express.Router();

let reservas = [];
let bookingIdCounter = 1;

const ocultarIdInterno = (reserva) => {
  const { id, alumno_id, ...resto } = reserva;
  return resto;
};

router.get('/', authMiddleware, (req, res) => {
  try {
    let reservasFiltered = reservas;

    if (req.user.role === 'alumno') {
      reservasFiltered = reservas.filter(r => r.alumno_id === req.user.id);
    }

    const datosPublicos = reservasFiltered.map(reserva => ({
      ...ocultarIdInterno(reserva),
      booking_id: reserva.id
    }));

    console.log(`[OK] GET /api/bookings - Usuario: ${req.user.email} (${req.user.role}) - Reservas encontradas: ${datosPublicos.length}`);

    res.json({ 
      success: true, 
      message: 'Listando reservas',
      total: datosPublicos.length,
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/bookings:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al listar reservas',
      error: error.message
    });
  }
});

router.post('/',
  authMiddleware,
  checkRole(['alumno']),
  (req, res) => {
    try {
      const nuevaReserva = {
        id: bookingIdCounter++,
        ...req.body,
        alumno_id: req.user.id,
        status: 'confirmada',
        created_at: new Date().toISOString()
      };
      
      reservas.push(nuevaReserva);
      
      const datosPublicos = {
        ...ocultarIdInterno(nuevaReserva),
        booking_id: nuevaReserva.id
      };

      console.log(`[OK] POST /api/bookings - Reserva creada por ${req.user.email} - ID: ${nuevaReserva.id} - Event ID: ${nuevaReserva.event_id}`);

      res.status(201).json({ 
        success: true, 
        message: 'Reserva creada exitosamente',
        data: datosPublicos 
      });
    } catch (error) {
      console.error(`[ERROR] ERROR en POST /api/bookings:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al crear reserva',
        error: error.message
      });
    }
  }
);

router.get('/:bookingId', authMiddleware, (req, res) => {
  try {
    const reserva = reservas.find(r => r.id === parseInt(req.params.bookingId));
    
    if (!reserva) {
      console.warn(`[WARN] GET /api/bookings/${req.params.bookingId} - Reserva no encontrada`);
      return res.status(404).json({
        success: false,
        message: `Reserva no encontrada`
      });
    }

    if (req.user.role === 'alumno' && reserva.alumno_id !== req.user.id) {
      console.warn(`[WARN] GET /api/bookings/${req.params.bookingId} - ${req.user.email} intentó acceder a reserva de otro alumno`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta reserva'
      });
    }
    
    const datosPublicos = {
      ...ocultarIdInterno(reserva),
      booking_id: reserva.id
    };

    console.log(`[OK] GET /api/bookings/${req.params.bookingId} - Reserva encontrada por ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Reserva encontrada',
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en GET /api/bookings/${req.params.bookingId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reserva',
      error: error.message
    });
  }
});

router.put('/:bookingId', authMiddleware, (req, res) => {
  try {
    const reserva = reservas.find(r => r.id === parseInt(req.params.bookingId));
    
    if (!reserva) {
      console.warn(`[WARN] PUT /api/bookings/${req.params.bookingId} - Reserva no encontrada`);
      return res.status(404).json({
        success: false,
        message: `Reserva no encontrada`
      });
    }

    if (req.user.role === 'alumno' && reserva.alumno_id !== req.user.id) {
      console.warn(`[WARN] PUT /api/bookings/${req.params.bookingId} - ${req.user.email} intentó actualizar reserva de otro alumno`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta reserva'
      });
    }
    
    const reservaActualizada = {
      ...reserva,
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const index = reservas.findIndex(r => r.id === parseInt(req.params.bookingId));
    reservas[index] = reservaActualizada;
    
    const datosPublicos = {
      ...ocultarIdInterno(reservaActualizada),
      booking_id: reservaActualizada.id
    };

    console.log(`[OK] PUT /api/bookings/${req.params.bookingId} - Reserva actualizada por ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Reserva actualizada exitosamente',
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en PUT /api/bookings/${req.params.bookingId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar reserva',
      error: error.message
    });
  }
});

router.put('/:bookingId/cancel', authMiddleware, (req, res) => {
  try {
    const reserva = reservas.find(r => r.id === parseInt(req.params.bookingId));
    
    if (!reserva) {
      console.warn(`[WARN] PUT /api/bookings/${req.params.bookingId}/cancel - Reserva no encontrada`);
      return res.status(404).json({
        success: false,
        message: `Reserva no encontrada`
      });
    }

    if (req.user.role === 'alumno' && reserva.alumno_id !== req.user.id) {
      console.warn(`[WARN] PUT /api/bookings/${req.params.bookingId}/cancel - ${req.user.email} intentó cancelar reserva de otro alumno`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar esta reserva'
      });
    }
    
    const reservaCancelada = {
      ...reserva,
      status: 'cancelada',
      cancelled_at: new Date().toISOString()
    };
    
    const index = reservas.findIndex(r => r.id === parseInt(req.params.bookingId));
    reservas[index] = reservaCancelada;
    
    const datosPublicos = {
      ...ocultarIdInterno(reservaCancelada),
      booking_id: reservaCancelada.id
    };

    console.log(`[OK] PUT /api/bookings/${req.params.bookingId}/cancel - Reserva cancelada por ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Reserva cancelada exitosamente',
      data: datosPublicos 
    });
  } catch (error) {
    console.error(`[ERROR] ERROR en PUT /api/bookings/${req.params.bookingId}/cancel:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar reserva',
      error: error.message
    });
  }
});

export default router;
