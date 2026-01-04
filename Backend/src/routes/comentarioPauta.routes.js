
import express from "express";
import { ComentarioPauta } from "../entities/comentarioPauta.entity.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { AppDataSource } from "../config/configDB.js";
import jwt from 'jsonwebtoken';
import { User } from "../entities/user.entity.js";
import { crearMensajeRetroalimentacion } from "../services/retroalimentacion.service.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_isw_2024';

// Middleware para verificar autenticación
const verificarAutenticacion = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.['jwt-auth'];
    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Obtener comentarios de una pauta evaluada
router.get('/:pautaEvaluadaId', async (req, res) => {
  try {
    const { pautaEvaluadaId } = req.params;
    const pautaIdNum = parseInt(pautaEvaluadaId, 10);
    if (Number.isNaN(pautaIdNum)) {
      return res.status(400).json({ message: 'pautaEvaluadaId inválido' });
    }

    const comentarioRepo = AppDataSource.getRepository(ComentarioPauta);
    const userRepo = AppDataSource.getRepository(User);
    const comentarios = await comentarioRepo.find({
      where: { pautaEvaluada: { id: pautaIdNum } },
      relations: ['pautaEvaluada'],
      order: { createdAt: 'ASC' }
    });

    // Adjuntar rol según el emisorRut
    const comentariosConRol = await Promise.all(
      (comentarios || []).map(async (coment) => {
        let rol = 'usuario';
        if (coment.emisorRut) {
          try {
            const u = await userRepo.findOne({ where: { rut: coment.emisorRut } });
            if (u?.role) rol = u.role;
          } catch (e) {
            // ignorar y dejar rol por defecto
          }
        }
        return { ...coment, rol };
      })
    );
    // Devolver 200 siempre, incluso si no hay comentarios
    return res.status(200).json({ comentarios: comentariosConRol || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener comentarios', error: err.message });
  }
});

// Crear comentario en una pauta evaluada (Profesor y Alumno)
router.post('/:pautaEvaluadaId', verificarAutenticacion, async (req, res) => {
  try {
    const { pautaEvaluadaId } = req.params;
    const { texto } = req.body;
    const pautaIdNum = parseInt(pautaEvaluadaId, 10);
    if (Number.isNaN(pautaIdNum)) {
      return res.status(400).json({ message: 'pautaEvaluadaId inválido' });
    }
    
    // Validaciones
    if (!texto || !texto.trim()) {
      return res.status(400).json({ message: 'El texto del comentario es obligatorio' });
    }
    
    const pautaRepo = AppDataSource.getRepository(PautaEvaluada);
    const pautaEvaluada = await pautaRepo.findOne({ where: { id: pautaIdNum } });
    if (!pautaEvaluada) {
      return res.status(404).json({ message: 'Pauta evaluada no encontrada' });
    }
    
    // Permitir que profesor, alumno y jefe de carrera comenten
    const rolesPermitidos = ['profesor', 'alumno', 'jefecarrera'];
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ message: 'Solo profesores, jefes de carrera y alumnos pueden comentar' });
    }

    // Crear comentario con datos del usuario autenticado
    const comentarioRepo = AppDataSource.getRepository(ComentarioPauta);
    const userRepo = AppDataSource.getRepository(User);

    // Intentar obtener datos completos desde la BD (por rut o id del token)
    let nombreEmisor = '';
    try {
      const userFromDb = await userRepo.findOne({
        where: [
          req.user.rut ? { rut: req.user.rut } : null,
          req.user.id ? { id: req.user.id } : null
        ].filter(Boolean)
      });
      if (userFromDb) {
        nombreEmisor = [userFromDb.nombres, userFromDb.apellidoPaterno, userFromDb.apellidoMaterno]
          .filter(Boolean)
          .join(' ')
          .trim();
      }
    } catch (e) {
      // Si falla la búsqueda, seguimos con los datos del token
    }

    if (!nombreEmisor) {
      const apellidos = [
        req.user.apellidoPaterno,
        req.user.apellidoMaterno,
        req.user.apellido_paterno,
        req.user.apellido_materno,
        req.user.apellidos,
        req.user.lastName,
        req.user.last_name
      ].filter(Boolean);

      nombreEmisor = [
        req.user.nombres || req.user.nombre || req.user.firstName || req.user.first_name,
        ...apellidos
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || req.user.nombre || req.user.email || 'Anónimo';
    }

    const comentario = comentarioRepo.create({
      texto: texto.trim(),
      emisor: nombreEmisor,
      emisorRut: req.user.rut || '',
      pautaEvaluada
    });
    await comentarioRepo.save(comentario);

    // Crear notificación usando el servicio de retroalimentación
    try {
      await crearMensajeRetroalimentacion(
        parseInt(pautaEvaluadaId, 10),
        texto.trim(),
        req.user
      );
      console.log(`✓ [Notificación] Creada para comentario en pauta ${pautaEvaluadaId}`);
    } catch (notifError) {
      console.error('Error al crear notificación:', notifError);
      // No fallar la petición si falla la notificación
    }

    // Emitir evento de WebSocket a todos los suscriptores de esta pauta
    const io = req.app.get('io');
    if (io) {
      const salaComentarios = `comentarios-pauta-${pautaEvaluadaId}`;
      io.to(salaComentarios).emit('nuevo-comentario-pauta', {
        pautaEvaluadaId,
        comentario: {
          id: comentario.id,
          texto: comentario.texto,
          emisor: comentario.emisor,
          emisorRut: comentario.emisorRut,
          rol: req.user.role,
          createdAt: comentario.createdAt,
        }
      });
      console.log(`✓ [Comentarios] ${req.user.role} (${req.user.rut}) comentó en pauta ${pautaEvaluadaId}`);
    }

    res.status(201).json({ 
      comentario,
      message: 'Comentario creado exitosamente' 
    });
  } catch (err) {
    console.error('Error al crear comentario:', err);
    res.status(500).json({ message: 'Error al crear comentario', error: err.message });
  }
});

export default router;

// Eliminar comentario (solo el autor)
router.delete('/:comentarioId', verificarAutenticacion, async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const idNum = parseInt(comentarioId, 10);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ message: 'comentarioId inválido' });
    }

    const comentarioRepo = AppDataSource.getRepository(ComentarioPauta);
    const comentario = await comentarioRepo.findOne({ where: { id: idNum } });
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    const rutToken = req.user?.rut;
    const esAutor = rutToken && comentario.emisorRut && comentario.emisorRut === rutToken;
    if (!esAutor) {
      return res.status(403).json({ message: 'Solo el autor puede eliminar su comentario' });
    }

    await comentarioRepo.delete({ id: idNum });
    return res.status(200).json({ message: 'Comentario eliminado' });
  } catch (err) {
    console.error('Error al eliminar comentario:', err);
    return res.status(500).json({ message: 'Error al eliminar comentario', error: err.message });
  }
});
