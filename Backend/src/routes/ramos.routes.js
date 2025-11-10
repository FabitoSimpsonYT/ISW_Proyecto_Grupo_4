import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import {
  createRamoHandler,
  getAllRamosHandler,
  getRamoByIdHandler,
  getRamoByCodigoHandler,
  updateRamoHandler,
  deleteRamoHandler,
  inscribirAlumno,
  getMisRamosHandler
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

// Ruta para obtener los ramos del usuario (inscritos para alumnos, dictados para profesores)
router.get("/misRamos",
  checkRole(["alumno", "profesor"]),
  getMisRamosHandler
);

router.get("/:codigo", 
  getRamoByCodigoHandler
);

router.put("/:codigo", 
  checkRole(["admin"]),
  validateRequest(updateRamoValidation), 
  updateRamoHandler
);

router.delete("/:codigo", 
  checkRole(["admin"]), 
  deleteRamoHandler
);

// Ruta para que el profesor o admin inscriban alumnos en los ramos
router.post("/inscribir", 
  checkRole(["profesor", "admin"]), 
  inscribirAlumno
);

export default router;