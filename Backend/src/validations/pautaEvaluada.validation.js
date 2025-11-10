import Joi from "joi";

export const createPautaEvaluadaValidation = Joi.object({
  alumno_id: Joi.number().required().messages({
    "number.base": "el id del alumno debe ser un número",
    "any.required": "el id del alumno es obligatorio",
  }),
  puntajes_obtenidos: Joi.object().required().messages({
    "object.base": "los puntajes_obtenidos deben ser un objeto",
    "any.required": "los puntajes_obtenidos son obligatorios",
  }),
  observaciones: Joi.string().allow(null, "").optional(),
});

export const updatePautaEvaluadaValidation = Joi.object({
  puntajes_obtenidos: Joi.object().optional(),
  observaciones: Joi.string().allow(null, "").optional(),
});
