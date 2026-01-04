import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isAlumno, isProfesor, isAdmin } from "../middleware/authorization.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createApelacion, getApelacionPorId, getMisApelaciones, deleteApelacion, getAllApelaciones, descargarArchivo, getApelacionesDelProfesor, updateEstadoApelacion, getApelacionesPorEstado, editarApelacionAlumno, getEvaluacionesDisponibles, getEvaluacionesProximas, getProfesoresInscritos} from "../controllers/apelacion.controller.js";
import { createApelacionValidation, updateEstadoValidation } from "../validations/apelacion.validation.js";
import { uploadSingleFile, handleFileUploadErrors } from "../middleware/subirArchivo.middleware.js";

const router = Router();

router.post( "/", authMiddleware, isAlumno, uploadSingleFile("archivo"), handleFileUploadErrors, validateRequest(createApelacionValidation), createApelacion);
router.get("/EvaluacionDisponible", authMiddleware, isAlumno, getEvaluacionesDisponibles);
router.get("/EvaluacionesProximas", authMiddleware, isAlumno, getEvaluacionesProximas);
router.get("/ProfesoresInscritos", authMiddleware, isAlumno, getProfesoresInscritos);

router.get("/estado/:estado", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "alumno" || role === "profesor" || role === "jefecarrera") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo alumnos, profesores o jefe de carrera pueden ver apelaciones por estado." });
}, getApelacionesPorEstado);

router.get("/mis-apelaciones", authMiddleware, isAlumno, getMisApelaciones);
router.get("/todo", authMiddleware, isAdmin, getAllApelaciones);
router.get("/:id/archivo", descargarArchivo);

router.get("/apelacionesProfesor", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "profesor" || role === "jefecarrera") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo profesores o jefe de carrera." });
}, getApelacionesDelProfesor);

router.get("/:id", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "alumno" || role === "profesor" || role === "jefecarrera") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo alumnos, profesores o jefe de carrera pueden ver apelaciones." });
}, getApelacionPorId);

router.put("/:id/editar", authMiddleware, isAlumno, uploadSingleFile("archivo"), editarApelacionAlumno);
router.put("/:id", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "profesor" || role === "jefecarrera") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo profesores o jefe de carrera." });
}, validateRequest(updateEstadoValidation), updateEstadoApelacion);

router.delete("/:id", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "profesor" || role === "jefecarrera") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo profesores o jefe de carrera." });
}, deleteApelacion);

export default router;  