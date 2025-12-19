import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isAlumno, isProfesor, isAdmin } from "../middleware/authorization.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { 
  createApelacion, 
  getApelacionPorId, 
  getMisApelaciones, 
  deleteApelacion, 
  getAllApelaciones, 
  descargarArchivo, 
  getApelacionesDelProfesor, 
  updateEstadoApelacion 
} from "../controllers/apelacion.controller.js";
import { createApelacionValidation, updateEstadoValidation } from "../validations/apelacion.validation.js";
import { uploadSingleFile, handleFileUploadErrors } from "../middleware/subirArchivo.middleware.js";

const router = Router();


router.post( "/", authMiddleware, isAlumno, uploadSingleFile("archivo"), handleFileUploadErrors, createApelacion);
router.get("/mis-apelaciones", authMiddleware, isAlumno, getMisApelaciones);
router.get("/todo", authMiddleware, isAdmin, getAllApelaciones);
router.get("/:id/archivo", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "alumno" || role === "profesor") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo alumnos o profesores pueden ver archivos." });
}, descargarArchivo);

router.get("/apelacionesProfesor", authMiddleware, isProfesor, getApelacionesDelProfesor);
router.get("/:id", authMiddleware, (req, res, next) => {
  const role = req.user?.role;
  if (role === "alumno" || role === "profesor") return next();
  return res.status(403).json({ message: "Acceso denegado. Solo alumnos o profesores pueden ver apelaciones." });
}, getApelacionPorId);

router.put("/:id", authMiddleware, isProfesor, validateRequest(updateEstadoValidation), updateEstadoApelacion);
router.delete("/:id", authMiddleware, isProfesor, deleteApelacion);

export default router;  