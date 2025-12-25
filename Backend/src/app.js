import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';
import { errorHandler, notFound } from './middlewares/errorHandler.middleware.js';
import { apiLimiter } from './middlewares/ratelimiter.middleware.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/events.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';
import profileRoutes from './routes/profile.routes.js';
import apelacionRoutes from './routes/apelacion.routes.js';
import path from 'path';
import bloqueoRoutes from "./bloqueo.routes.js";

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(helmet());
app.use('/api/', apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));

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

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/apelaciones', apelacionRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);


// Middlewares finales
app.use(notFound);
app.use(errorHandler);

export default app;
