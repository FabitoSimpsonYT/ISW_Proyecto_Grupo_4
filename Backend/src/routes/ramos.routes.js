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
import { createRamoValidation, updateRamoValidation, createSeccionValidation } from "../validations/ramos.validation.js";

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

// Ruta para obtener los ramos del usuario (inscritos para alumnos, dictados para profesores)
// IMPORTANTE: Esta ruta debe ir ANTES que router.get("/") porque es más específica
router.get("/misRamos",
  checkRole(["alumno", "profesor"]),
  getMisRamosHandler
);

// Rutas de lectura accesibles para todos los usuarios autenticados
// NOTA: Esta ruta genérica debe ir al final para no interceptar /misRamos y /:codigo
router.get("/", 
  getAllRamosHandler
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

// Ruta para crear secciones pasando RUTs de alumnos
router.post("/secciones",
  checkRole(["profesor", "admin"]),
  validateRequest(createSeccionValidation),
  async (req, res, next) => {
    // Lazy require controller handler to avoid circular imports in some setups
    const { createSeccionHandler } = await import("../controllers/ramos.controller.js");
    return createSeccionHandler(req, res, next);
  }
);

export default router;