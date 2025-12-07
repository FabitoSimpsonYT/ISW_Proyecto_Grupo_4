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

router.use(authMiddleware);

router.post("/", 
  checkRole(["admin"]),
  validateRequest(createRamoValidation), 
  createRamoHandler
);

router.get("/", 
  getAllRamosHandler
);

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

router.post("/inscribir", 
  checkRole(["profesor", "admin"]), 
  inscribirAlumno
);

export default router;