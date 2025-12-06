import Joi from "joi";

export const validateRetroalimentacion = Joi.object({
  contenido: Joi.string().required().min(1).max(2000)
    .messages({
      "string.empty": "El contenido de la retroalimentación no puede estar vacío",
      "string.min": "El contenido debe tener al menos 1 caracter",
      "string.max": "El contenido no puede exceder los 2000 caracteres"
    }),
  tipo: Joi.string().required().valid("retroalimentacion", "observacion", "sugerencia", "respuesta")
    .messages({
      "any.only": "El tipo debe ser uno de: retroalimentacion, observacion, sugerencia, respuesta"
    })
});