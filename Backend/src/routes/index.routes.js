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
import apelacionRoutes from "./apelacion.routes.js";

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
  router.use("/pauta", pautaRoutes)
  router.use("/pauta-evaluadas", pautaEvaluadaRoutes);
  router.use("/apelaciones", apelacionRoutes);
}
