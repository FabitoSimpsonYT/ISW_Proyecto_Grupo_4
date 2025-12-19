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

router.use(checkRole(["admin"]));

router.post("/", 
  validateRequest(createAdminValidation), 
  createAdminHandler
);

router.get("/", 
  getAllAdminsHandler
);

router.get("/:id", 
  getAdminByIdHandler
);

router.put("/:id", 
  validateRequest(updateAdminValidation), 
  updateAdminHandler
);

router.delete("/:id", 
  deleteAdminHandler
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

export default router;
