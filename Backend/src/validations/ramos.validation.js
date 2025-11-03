import Joi from "joi";

export const createRamoValidation = Joi.object({
  nombre: Joi.string()
    .required()
    .min(3)
    .max(255)
    .messages({
      "string.empty": "El nombre del ramo es obligatorio",
      "string.min": "El nombre del ramo debe tener al menos 3 caracteres",
      "string.max": "El nombre del ramo no puede exceder los 255 caracteres",
      "any.required": "El nombre del ramo es obligatorio"
    }),
  codigo: Joi.string()
    .required()
    .pattern(/^[A-Z]{3}[0-9]{4}$/)
    .messages({
      "string.empty": "El código del ramo es obligatorio",
      "string.pattern.base": "El código debe tener el formato ABC1234 (3 letras mayúsculas seguidas de 4 números)",
      "any.required": "El código del ramo es obligatorio"
    }),
  rutProfesor: Joi.string()
    .pattern(/^\d{7,8}-[\dkK]$/)
    .allow(null)
    .messages({
      "string.pattern.base": "El RUT debe tener uno de estos formatos: 12345678-9, 12345678-K, 1234567-8 o 1234567-K",
      "string.empty": "El RUT no puede estar vacío"
    })
});

export const updateRamoValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(255)
    .messages({
      "string.min": "El nombre del ramo debe tener al menos 3 caracteres",
      "string.max": "El nombre del ramo no puede exceder los 255 caracteres"
    }),
  codigo: Joi.string()
    .pattern(/^[A-Z]{3}[0-9]{4}$/)
    .messages({
      "string.pattern.base": "El código debe tener el formato ABC1234 (3 letras mayúsculas seguidas de 4 números)"
    }),
  profesorId: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      "number.base": "El ID del profesor debe ser un número",
      "number.integer": "El ID del profesor debe ser un número entero",
      "number.positive": "El ID del profesor debe ser positivo"
    })
}).min(1);