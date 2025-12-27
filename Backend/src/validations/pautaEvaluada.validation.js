import Joi from "joi";

export const createPautaEvaluadaValidation = Joi.object({
  alumnoRut: Joi.string().pattern(/^\d{7,8}-[\dKk]$/).required().messages({
    "string.pattern.base": "el RUT debe tener formato: 12345678-9 o 12345678-K",
    "any.required": "el RUT del alumno es obligatorio",
  }),
  puntajes_obtenidos: Joi.object().required().messages({
    "object.base": "los puntajes_obtenidos deben ser un objeto",
    "any.required": "los puntajes_obtenidos son obligatorios",
  }),
  observaciones: Joi.string().allow(null, "").optional(),
  codigoRamo: Joi.string().allow(null, "").optional(),
  idEvaluacion: Joi.number().allow(null).optional(),
  idPauta: Joi.number().allow(null).optional(),
});

export const updatePautaEvaluadaValidation = Joi.object({
  puntajes_obtenidos: Joi.object().optional(),
  observaciones: Joi.string().allow(null, "").optional(),
  alumnoRut: Joi.string().optional(),
  idPauta: Joi.number().optional(),
  idEvaluacion: Joi.number().optional(),
  codigoRamo: Joi.string().optional(),
}).unknown(true);
