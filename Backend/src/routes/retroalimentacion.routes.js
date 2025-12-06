import { Router } from "express";
import { addRetroalimentacion, getRetroalimentaciones } from "../controllers/retroalimentacion.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = Router();

router.post("/pautas/:pautaId/retroalimentacion",
  authMiddleware,
  checkRole(["profesor", "alumno"]),
  addRetroalimentacion
);

router.get("/pautas/:pautaId/retroalimentacion",
  authMiddleware,
  checkRole(["profesor", "alumno"]),
  getRetroalimentaciones
);

export default router;