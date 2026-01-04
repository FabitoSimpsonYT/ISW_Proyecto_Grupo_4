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
      .pattern(/^\d{6}-\d{4}-[12]$/)
      .messages({
        "string.empty": "El código del ramo es obligatorio",
        "string.pattern.base": "El código debe tener el formato 620515-2025-2",
        "any.required": "El código del ramo es obligatorio"
      }),
  anio: Joi.number()
    .integer()
    .required()
    .min(new Date().getFullYear() - 1)
    .max(new Date().getFullYear())
    .messages({
      "number.base": "El año debe ser un número",
      "number.integer": "El año debe ser un número entero",
      "number.max": "El año no puede ser mayor al año actual",
      "number.min": "No se pueden crear ramos de hace dos años o más",
      "any.required": "El año es obligatorio"
    }),
  periodo: Joi.number()
    .integer()
    .required()
    .valid(1, 2)
    .messages({
      "number.base": "El periodo debe ser un número",
      "number.integer": "El periodo debe ser un número entero",
      "any.only": "El periodo debe ser 1 o 2",
      "any.required": "El periodo es obligatorio"
    }),
  rutProfesor: Joi.string()
    .pattern(/^\d{7,8}-[\dkK]$/)
    .allow(null)
    .messages({
      "string.pattern.base": "El RUT debe tener uno de estos formatos: 12345678-9, 12345678-K, 1234567-8 o 1234567-K",
      "string.empty": "El RUT no puede estar vacío"
    })
}).custom((value, helpers) => {
  // Validación especial: limitar creación de periodo 2 según fecha
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const esDespuesDeJulio = hoy.getMonth() > 6 || (hoy.getMonth() === 6 && hoy.getDate() > 1);
  if (value.periodo === 2 && value.anio > anioActual && !esDespuesDeJulio) {
    return helpers.error('any.custom', { message: 'No puedes crear un ramo para el segundo semestre de un año futuro antes del 1 de julio del año en curso.' });
  }
  if (value.periodo === 2 && value.anio === anioActual && !esDespuesDeJulio) {
    return helpers.error('any.custom', { message: 'No puedes crear un ramo para el segundo semestre del año en curso antes del 1 de julio.' });
  }
  return value;
}).messages({
  'any.custom': '{{#message}}'
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
    .pattern(/^\d{6}-\d{4}-[12]$/)
    .messages({
      "string.pattern.base": "El código debe tener el formato 620515-2025-2"
    }),
  anio: Joi.number()
    .integer()
    .min(new Date().getFullYear() - 1)
    .max(new Date().getFullYear())
    .messages({
      "number.base": "El año debe ser un número",
      "number.integer": "El año debe ser un número entero",
      "number.max": "El año no puede ser mayor al año actual",
      "number.min": "No se pueden crear ramos de hace dos años o más"
    }),
  periodo: Joi.number()
    .integer()
    .valid(1, 2)
    .messages({
      "number.base": "El periodo debe ser un número",
      "number.integer": "El periodo debe ser un número entero",
      "any.only": "El periodo solo puede ser 1 o 2"
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
    .pattern(/^\d{6}-\d{4}-[12]$/)
    .messages({
      "string.empty": "El código del ramo es obligatorio",
      "string.pattern.base": "El código debe tener el formato CCCCCC-YYYY-P (ej: 620515-2025-1)",
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