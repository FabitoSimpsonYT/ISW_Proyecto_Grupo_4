import express from "express";
import { checkRole } from "../middleware/role.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getPromedioFinal, getPromediosPorRamo, createPromedioParcial, createPromedioFinal, updatePromedioFinal, getPromediosByAlumno, calcularPromediosRamo, calcularTodosParcial, calcularTodosFinal } from "../controllers/alumnoPromedioRamo.controller.js";

const router = express.Router();

// Aplicar autenticación a TODAS las rutas de este router
router.use(authMiddleware);

// GET /api/promedios/alumno/:alumnoRut
// Obtener todos los promedios de un alumno en todos sus ramos (lectura para todos)
router.get("/alumno/:alumnoRut", checkRole(["alumno", "profesor", "jefecarrera"]), getPromediosByAlumno);

// GET /api/promedios/:codigoRamo/alumno/:alumnoRut/promedio
// Obtener promedio final de un alumno (lectura para todos)
router.get("/:codigoRamo/alumno/:alumnoRut/promedio", checkRole(["alumno", "profesor", "jefecarrera"]), getPromedioFinal);

// GET /api/promedios/:codigoRamo/promedios
// Obtener promedios de TODOS los alumnos en un ramo (lectura para profesores/jefes)
router.get("/:codigoRamo/promedios", 
  checkRole(["profesor", "jefecarrera"]),
  getPromediosPorRamo
);

// POST /api/promedios/:codigoRamo/alumno/:alumnoRut/parcial
// Calcular y guardar promedio parcial de un alumno (solo profesores/jefes)
router.post("/:codigoRamo/alumno/:alumnoRut/parcial", 
  checkRole(["profesor", "jefecarrera"]),
  createPromedioParcial
);

// POST /api/promedios/:codigoRamo/alumno/:alumnoRut/final
// Calcular y guardar promedio final de un alumno (con integradora si existe) (solo profesores/jefes)
router.post("/:codigoRamo/alumno/:alumnoRut/final", 
  checkRole(["profesor", "jefecarrera"]),
  createPromedioFinal
);

// POST /api/promedios/:codigoRamo/alumno/:alumnoRut (antiguo, mantener compatibilidad)
// Calcular y crear promedio final de un alumno (solo profesores/jefes)
router.post("/:codigoRamo/alumno/:alumnoRut", 
  checkRole(["profesor", "jefecarrera"]),
  createPromedioFinal
);

// PATCH /api/promedios/:codigoRamo/alumno/:alumnoRut
// Actualizar promedio parcial cuando cambia una nota (solo profesores/jefes)
router.patch("/:codigoRamo/alumno/:alumnoRut", 
  checkRole(["profesor", "jefecarrera"]),
  updatePromedioFinal
);

// POST /api/promedios/:codigoRamo/calcular-todos-parcial
// Calcular promedio PARCIAL para TODOS los alumnos inscritos en un ramo (solo profesores/jefes)
router.post("/:codigoRamo/calcular-todos-parcial",
  checkRole(["profesor", "jefecarrera"]),
  calcularTodosParcial
);

// POST /api/promedios/:codigoRamo/calcular-todos-final
// Calcular promedio FINAL para TODOS los alumnos inscritos en un ramo (solo profesores/jefes)
router.post("/:codigoRamo/calcular-todos-final",
  checkRole(["profesor", "jefecarrera"]),
  calcularTodosFinal
);

// POST /api/promedios/:codigoRamo/calcular-todos (antiguo, mantener compatibilidad)
// Calcular promedios para TODOS los alumnos inscritos en un ramo (solo profesores/jefes)
router.post("/:codigoRamo/calcular-todos",
  checkRole(["profesor", "jefecarrera"]),
  calcularPromediosRamo
);

export default router;