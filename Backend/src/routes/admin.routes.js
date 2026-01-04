import { Router } from "express";
import {
  createAdminHandler,
  getAllAdminsHandler,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler,
  promoverProfesorAJefeCarreraHandler,
  degradarJefeCarreraAProfesorHandler,
  getJefeCarreraActualHandler
} from "../controllers/admin.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createAdminValidation, updateAdminValidation } from "../validations/admin.validation.js";

const router = Router();

router.use(authMiddleware);

router.use(checkRole(["admin", "jefecarrera"]));

router.post("/", 
  validateRequest(createAdminValidation), 
  createAdminHandler
);

router.get("/", 
  getAllAdminsHandler
);

router.post("/promover", 
  promoverProfesorAJefeCarreraHandler
);

router.post("/degradar", 
  degradarJefeCarreraAProfesorHandler
);

router.get("/jefe-carrera", 
  getJefeCarreraActualHandler
);

router.get("/:id", 
  getAdminByIdHandler
);

router.patch("/:id", 
  validateRequest(updateAdminValidation), 
  updateAdminHandler
);

router.delete("/:id", 
  deleteAdminHandler
);

export default router;
