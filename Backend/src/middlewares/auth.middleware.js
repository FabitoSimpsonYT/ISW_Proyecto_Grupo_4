import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.utils.js';
import config from '../config/config.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, 'Acceso denegado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    
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

export const injectEntityIds = (entityType) => async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return sendError(res, `Código de ${entityType} no proporcionado`, 400);
    }

    let query;
    switch (entityType) {
      case 'event':
        query = 'SELECT id FROM events WHERE code = $1';
        break;
      case 'booking':
        query = 'SELECT id FROM bookings WHERE code = $1';
        break;
    }

    const result = await pool.query(query, [code]);
    
    if (result.rows.length === 0) {
      return sendError(res, `${entityType} no encontrado`, 404);
    }

    req[`${entityType}Id`] = result.rows[0].id;
    
    next();
  } catch (error) {
    next(error);
  }
};
