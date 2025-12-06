import { logger } from '../utils/logger.utils.js';
import { sendError } from '../utils/response.utils.js';

export const notFound = (req, res, next) => {
  sendError(res, 'Ruta no encontrada', 404);
};

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return sendError(res, 'Error de validación', 400, err.details);
  }

  if (err.code === '23505') {
    return sendError(res, 'El registro ya existe', 400);
  }


  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'No autorizado', 401);
  }

  sendError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    err.status || 500
  );
};