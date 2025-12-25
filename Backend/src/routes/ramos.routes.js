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
  getMisRamosHandler,
  createSeccionHandler,
  getSeccionesByRamoHandler,
  deleteSeccionHandler,
  getAlumnosBySeccion,
  buscarAlumnosHandler,
} from "../controllers/ramos.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createRamoValidation, updateRamoValidation, createSeccionValidation } from "../validations/ramos.validation.js";
import { getAllAlumnosHandler } from "../controllers/alumno.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", 
  checkRole(["admin", "jefecarrera"]),
  validateRequest(createRamoValidation), 
  createRamoHandler
);

router.post("/inscribir/:codigoRamo/:seccionId", 
  checkRole(["profesor", "jefecarrera", "admin"]), 
  inscribirAlumno
);


// Buscar alumnos por query (nombre, apellido, rut)
router.get("/alumnos", 
  authMiddleware,
  checkRole(["profesor", "jefecarrera", "admin"]),
  buscarAlumnosHandler
);

// Obtener alumnos inscritos en una sección
router.get("/alumnos/:codigoRamo/:numero", 
  checkRole(["profesor", "jefecarrera", "admin"]),
  getAlumnosBySeccion
);

// Obtener todos los alumnos (igual que gestor de usuarios)

router.get("/alumnos/todos",
  checkRole(["profesor", "jefecarrera", "admin"]),
  getAllAlumnosHandler
);


// Crear sección: ahora recibe el código de ramo como parámetro
router.post("/secciones/:codigoRamo", 
  checkRole(["profesor", "admin", "jefecarrera"]),
  validateRequest(createSeccionValidation),
  createSeccionHandler
);

router.get("/secciones/:codigo",
  getSeccionesByRamoHandler
);

router.delete("/secciones/:codigoRamo/:seccionId",
  checkRole(["profesor", "admin", "jefecarrera"]),
  deleteSeccionHandler
);

router.get("/", 
  getAllRamosHandler
);

router.get("/misRamos",
  checkRole(["alumno", "profesor", "jefecarrera"]),
  getMisRamosHandler
);

router.get("/:codigo", 
  getRamoByCodigoHandler
);

router.patch("/:codigo", 
  checkRole(["admin", "jefecarrera"]),
  validateRequest(updateRamoValidation), 
  updateRamoHandler
);

router.delete("/:codigo", 
  checkRole(["admin", "jefecarrera"]), 
  deleteRamoHandler
);



export default router;