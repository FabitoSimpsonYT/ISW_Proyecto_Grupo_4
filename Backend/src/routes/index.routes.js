import { Router } from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import ramosRoutes from "./ramos.routes.js";
import profesorRoutes from "./profesor.routes.js";
import alumnoRoutes from "./alumno.routes.js";
import adminRoutes from "./admin.routes.js";
import evaluacionesRoutes from "./evaluaciones.routes.js";
import pautaRoutes from "./pauta.routes.js";
import pautaEvaluadaRoutes from "./pautaEvaluada.routes.js";
import notificacionRoutes from "./notificacionuno.routes.js";
import eventsRoutes from "./events.routes.js";
import bookingRoutes from "./booking.routes.js";
import agendamientosRoutes from "./agendamientos.routes.js";

export function routerApi(app) {
  const router = Router();
  app.use("/api", router);

  router.use("/auth", authRoutes);
  router.use("/profile", profileRoutes);
  router.use("/ramos", ramosRoutes);
  router.use("/profesores", profesorRoutes);
  router.use("/alumnos", alumnoRoutes);
  router.use("/admin", adminRoutes);
  router.use("/evaluaciones", evaluacionesRoutes);
  router.use("/pauta", pautaRoutes);
  router.use("/pauta-evaluadas", pautaEvaluadaRoutes);
  router.use("/notificaciones", notificacionRoutes);
  router.use("/events", eventsRoutes);
  router.use("/bookings", bookingRoutes);
  router.use("/agendamientos", agendamientosRoutes);
}
