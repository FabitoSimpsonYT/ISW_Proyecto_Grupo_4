import { Router } from "express";
import {
  createAdminHandler,
  getAllAdminsHandler,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler
} from "../controllers/admin.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createAdminValidation, updateAdminValidation } from "../validations/admin.validation.js";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Solo los administradores pueden acceder a estas rutas
router.use(checkRole(["admin"]));

// CRUD de administradores
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

export default router;