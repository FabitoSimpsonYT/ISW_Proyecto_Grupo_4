import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPautaEvaluada, getPautaEvaluada, getPautasEvaluadasByEvaluacion, updatePautaEvaluada, deletePautaEvaluada, createPautaEvaluadaIntegradora, getPautaEvaluadaIntegradora, updatePautaEvaluadaIntegradora, deletePautaEvaluadaIntegradora } from "../controllers/pautaEvaluada.controller.js";

const router = Router();

// Detectar si es ruta de integradora basado en la estructura de parámetros
// Si el nombre contiene "integradora" en la URL, se maneja diferente
// Para esto usamos middleware/lógica en los controladores

// Ruta POST para crear - POST /:id1/:id2
// Se determina si es evaluacionId/pautaId o evaluacionIntegradoraId/pautaId por contexto
router.post("/:evaluacionId/:pautaId", authMiddleware, (req, res) => {
  // Determinar si es integradora o normal por el URL
  const url = req.baseUrl;
  if (url.includes('integradora')) {
    createPautaEvaluadaIntegradora(req, res);
  } else {
    createPautaEvaluada(req, res);
  }
});

// Ruta GET para obtener una pauta - GET /:id1/:id2
router.get("/:evaluacionId/:alumnoRut", authMiddleware, (req, res) => {
  const url = req.baseUrl;
  if (url.includes('integradora')) {
    getPautaEvaluadaIntegradora(req, res);
  } else {
    getPautaEvaluada(req, res);
  }
});

// Ruta PATCH para actualizar - PATCH /:id1/:id2
router.patch("/:evaluacionId/:alumnoRut", authMiddleware, (req, res) => {
  const url = req.baseUrl;
  if (url.includes('integradora')) {
    updatePautaEvaluadaIntegradora(req, res);
  } else {
    updatePautaEvaluada(req, res);
  }
});

// Ruta DELETE para eliminar - DELETE /:id1/:id2
router.delete("/:evaluacionId/:alumnoRut", authMiddleware, (req, res) => {
  const url = req.baseUrl;
  if (url.includes('integradora')) {
    deletePautaEvaluadaIntegradora(req, res);
  } else {
    deletePautaEvaluada(req, res);
  }
});

// Ruta GET para obtener todas las pautas de una evaluación (solo normal)
router.get("/:evaluacionId", authMiddleware, getPautasEvaluadasByEvaluacion);

export default router;
