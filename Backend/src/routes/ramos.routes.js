import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isAdmin, isProfesor } from "../middleware/authorization.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import {
  createRamoHandler,
  getAllRamosHandler,
  getRamoByIdHandler,
  getRamoByCodigoHandler,
  updateRamoHandler,
  deleteRamoHandler,
  inscribirAlumno
} from "../controllers/ramos.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createRamoValidation, updateRamoValidation } from "../validations/ramos.validation.js";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas CRUD básicas
// Solo admin puede crear, actualizar y eliminar ramos
router.post("/", 
  checkRole(["admin"]),
  validateRequest(createRamoValidation), 
  createRamoHandler
);

// Rutas de lectura accesibles para todos los usuarios autenticados
router.get("/", 
  getAllRamosHandler
);

router.get("/:id", 
  getRamoByIdHandler
);

router.get("/codigo/:codigo", 
  getRamoByCodigoHandler
);

router.put("/:id", 
  checkRole(["admin"]),
  validateRequest(updateRamoValidation), 
  updateRamoHandler
);

router.delete("/:id", 
  checkRole(["admin"]), 
  deleteRamoHandler
);

// Ruta para que el profesor inscriba alumnos en sus ramos
router.post("/inscribir", isProfesor, inscribirAlumno);

export default router;