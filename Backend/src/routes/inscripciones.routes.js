import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Ruta para obtener inscripciones de un evento específico
router.get('/evento/:eventoId', authMiddleware, async (req, res) => {
  try {
    const { eventoId } = req.params;
    const user = req.user;

    // Verificar que sea profesor
    if (user.role !== 'profesor') {
      return res.status(403).json({
        success: false,
        message: 'Solo profesores pueden acceder a inscripciones'
      });
    }

    // Simulamos obtener inscripciones del evento
    const inscripciones = [
      {
        id: 1,
        eventoId: eventoId,
        alumnoEmail: 'alumno1@example.com',
        estado: 'confirmado',
        horarioAsignado: {
          inicio: new Date().toISOString(),
          fin: new Date(Date.now() + 30 * 60000).toISOString()
        },
        cantidadMiembros: 1,
        miembrosGrupo: []
      }
    ];

    res.json({
      success: true,
      data: inscripciones,
      message: 'Inscripciones obtenidas exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener inscripciones',
      error: error.message
    });
  }
});

export default router;
