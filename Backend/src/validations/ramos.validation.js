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
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.empty": "El código del ramo es obligatorio",
      "string.length": "El código del ramo debe tener exactamente 6 caracteres",
      "string.pattern.base": "El código debe contener solo números",
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
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.length": "El código del ramo debe tener exactamente 6 caracteres",
      "string.pattern.base": "El código debe contener solo números"
    }),
  rutProfesor: Joi.string()
    .pattern(/^\d{7,8}-[\dkK]$/)
    .allow(null)
    .messages({
      "string.pattern.base": "El RUT debe tener uno de estos formatos: 12345678-9, 12345678-K, 1234567-8 o 1234567-K",
      "string.empty": "El RUT no puede estar vacío"
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

export const createSeccionValidation = Joi.object({
  codigoRamo: Joi.string()
    .required()
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .messages({
      "string.empty": "El código del ramo es obligatorio",
      "string.length": "El código del ramo debe tener exactamente 6 caracteres",
      "string.pattern.base": "El código del ramo debe contener solo números",
      "any.required": "El código del ramo es obligatorio"
    }),
  numero: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "El número de sección debe ser un número",
      "number.integer": "El número de sección debe ser un entero",
      "number.min": "El número de sección debe ser al menos 1",
      "any.required": "El número de sección es obligatorio"
    }),
  alumnosRut: Joi.array()
    .items(Joi.string().pattern(/^\d{7,8}-[\dkK]$/))
    .optional()
    .messages({
      "string.pattern.base": "Cada RUT debe tener un formato válido (12345678-9)"
    })
}).unknown(false);