// Backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_isw_2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado'
    });
  }
};

// Middleware para profesores
const profesorMiddleware = (req, res, next) => {
  if (req.user.role !== 'profesor' && req.user.role !== 'jefe_carrera') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de profesor'
    });
  }
  next();
};

// Middleware para alumnos
const alumnoMiddleware = (req, res, next) => {
  if (req.user.role !== 'alumno') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de alumno'
    });
  }
  next();
};

// Middleware para jefe de carrera
const jefeCarreraMiddleware = (req, res, next) => {
  if (req.user.role !== 'jefe_carrera') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de jefe de carrera'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  profesorMiddleware,
  alumnoMiddleware,
  jefeCarreraMiddleware
};