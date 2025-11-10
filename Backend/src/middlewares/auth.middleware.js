// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.utils.js';
import config from '../config/config.js';

export const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, 'Acceso denegado - Token no proporcionado', 401);
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    sendError(res, 'Token inválido', 401);
  }
};

// Middleware para inyectar IDs desde el token
export const injectEntityIds = (entityType) => async (req, res, next) => {
  try {
    const { code } = req.body; // Usar código en lugar de ID en el body
    
    if (!code) {
      return sendError(res, `Código de ${entityType} no proporcionado`, 400);
    }

    // Consultar ID interno basado en el código
    let query;
    switch (entityType) {
      case 'event':
        query = 'SELECT id FROM events WHERE code = $1';
        break;
      case 'booking':
        query = 'SELECT id FROM bookings WHERE code = $1';
        break;
      // Añadir más casos según sea necesario
    }

    const result = await pool.query(query, [code]);
    
    if (result.rows.length === 0) {
      return sendError(res, `${entityType} no encontrado`, 404);
    }

    // Inyectar ID interno en el request
    req[`${entityType}Id`] = result.rows[0].id;
    
    next();
  } catch (error) {
    next(error);
  }
};
