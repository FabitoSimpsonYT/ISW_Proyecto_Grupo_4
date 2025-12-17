import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", authMiddleware, register);
router.post("/logout", authMiddleware, (req, res) => {
  try {
    // El logout en token JWT se maneja en el cliente removiendo el token
    // El servidor solo confirma que se puede cerrar sesión
    res.json({ success: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al cerrar sesión" });
  }
});

export default router;
