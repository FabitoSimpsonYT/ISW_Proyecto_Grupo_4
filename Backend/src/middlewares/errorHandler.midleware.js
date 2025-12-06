export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  let error = { ...err };
  error.message = err.message;
  
  if (err.code === '23505') {
    error.message = 'Ya existe un registro con ese valor';
    error.statusCode = 400;
  }

  if (err.code === '23503') {
    error.message = 'Referencia inválida';
    error.statusCode = 400;
  }

  if (err.code === '23514') {
    error.message = 'Valor no válido';
    error.statusCode = 400;
  }
  
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token inválido';
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expirado';
    error.statusCode = 401;
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error del servidor',
    ...(config.env === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
};