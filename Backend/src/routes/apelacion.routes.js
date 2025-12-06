import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isAlumno, isProfesor, isAdmin, } from "../middleware/authorization.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createApelacion, getApelacionPorId, getMisApelaciones, deleteApelacion, getAllApelaciones, getApelacionesDelProfesor, updateEstadoApelacion} from "../controllers/apelacion.controller.js";
import { createApelacionValidation, updateEstadoValidation, } from "../validations/apelacion.validation.js";
import { uploadArchivoApelacion, handleFileUploadErrors } from "../middleware/subirArchivo.middleware.js";
import { subirArchivo, descargarArchivo } from "../controllers/apelacion.controller.js";


const router = Router();


router.post("/",  authMiddleware, uploadArchivoApelacion, handleFileUploadErrors,isAlumno, validateRequest(createApelacionValidation), createApelacion);
router.post("/:id/archivo", authMiddleware, isAlumno, uploadArchivoApelacion, handleFileUploadErrors, subirArchivo );
router.get("/descargar/:id", authMiddleware, isAlumno, descargarArchivo);
router.get("/mis-apelaciones", authMiddleware, isAlumno, getMisApelaciones);
router.get("/todo", authMiddleware, isAdmin, getAllApelaciones);
router.get("/apelacionesProfesor", authMiddleware, isProfesor, getApelacionesDelProfesor);
router.get("/:id",authMiddleware, (req, res, next) => { const role = req.user?.role;
    if (role === "alumno" || role === "profesor") {
      return next();
    }
    return res.status(403).json({message: "Acceso denegado. Solo alumnos o profesores pueden ver apelaciones.",});
},getApelacionPorId);
router.put("/:id", authMiddleware, isProfesor, validateRequest(updateEstadoValidation), updateEstadoApelacion);
router.delete("/:id", authMiddleware, isAdmin, deleteApelacion);

export default router;
