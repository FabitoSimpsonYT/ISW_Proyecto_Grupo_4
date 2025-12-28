import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
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

export const profesorMiddleware = (req, res, next) => {
  if (req.user.role !== 'profesor' && req.user.role !== 'jefe_carrera') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de profesor'
    });
  }
  next();
};

export const alumnoMiddleware = (req, res, next) => {
  if (req.user.role !== 'alumno') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de alumno'
    });
  }
  next();
};

export const jefeCarreraMiddleware = (req, res, next) => {
  if (req.user.role !== 'jefe_carrera') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de jefe de carrera'
    });
  }
  next();
};

export const adminOrJefeCarreraMiddleware = (req, res, next) => {
  // Solo jefe_carrera (o jefecarrera sin guión) puede crear/eliminar bloqueos
  const isJefeCarrera = req.user?.role === 'jefe_carrera' || req.user?.role === 'jefecarrera';
  
  if (!isJefeCarrera) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo jefe de carrera puede crear/eliminar bloqueos',
      userRole: req.user?.role
    });
  }
  next();
};