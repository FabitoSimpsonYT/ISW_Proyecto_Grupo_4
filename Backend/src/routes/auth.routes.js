import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", authMiddleware, register);

export default router;
