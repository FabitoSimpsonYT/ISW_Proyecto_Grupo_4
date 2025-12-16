import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import ramosRoutes from './routes/ramos.routes.js';
import profesorRoutes from './routes/profesor.routes.js';

const app = express();

app.use(helmet());
// Habilitar CORS dinámico en desarrollo (refleja el Origin).
// En producción se usará el valor exacto de `config.frontendUrl`.
const corsOptions = config.env === 'development'
  ? { origin: true, credentials: true }
  : { origin: config.frontendUrl, credentials: true };

app.use(cors(corsOptions));
app.use('/api/', apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ramos', ramosRoutes);
app.use("/profesores", profesorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
