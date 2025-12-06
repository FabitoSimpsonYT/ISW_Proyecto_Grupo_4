import Joi from "joi";
import { telefonoPattern } from "./users.validation.js";

export const createAdminValidation = Joi.object({
  rut: Joi.string()
    .required()
    .pattern(/^\d{7,8}-[0-9kK]$/)
    .messages({
      "string.empty": "El rut es obligatorio",
      "string.pattern.base": "El rut debe tener un formato válido (ej: 12345678-9)",
      "any.required": "El rut es obligatorio"
    }),
  nombres: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "El nombre es obligatorio",
      "string.min": "El nombre debe tener al menos 2 caracteres",
      "string.max": "El nombre no puede exceder los 100 caracteres",
      "any.required": "El nombre es obligatorio"
    }),
  apellidoPaterno: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "El apellido paterno es obligatorio",
      "string.min": "El apellido paterno debe tener al menos 2 caracteres",
      "string.max": "El apellido paterno no puede exceder los 100 caracteres",
      "any.required": "El apellido paterno es obligatorio"
    }),
  apellidoMaterno: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "El apellido materno es obligatorio",
      "string.min": "El apellido materno debe tener al menos 2 caracteres",
      "string.max": "El apellido materno no puede exceder los 100 caracteres",
      "any.required": "El apellido materno es obligatorio"
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "El email debe ser válido",
      "string.empty": "El email es obligatorio",
      "any.required": "El email es obligatorio"
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .required()
    .messages({
      "string.min": "La contraseña debe tener al menos 8 caracteres",
      "string.pattern.base": "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
      "string.empty": "La contraseña es obligatoria",
      "any.required": "La contraseña es obligatoria"
    }),
  telefono: Joi.string()
    .pattern(telefonoPattern)
    .required()
    .messages({
      "string.empty": "El teléfono es obligatorio",
      "string.pattern.base": "El teléfono debe tener el formato +56912345678 o +56411234567 (12 caracteres)",
      "any.required": "El teléfono es obligatorio"
    })
});

export const updateAdminValidation = Joi.object({
  nombres: Joi.string()
    .min(2)
    .max(100),
  apellidoPaterno: Joi.string()
    .min(2)
    .max(100),
  apellidoMaterno: Joi.string()
    .min(2)
    .max(100),
  email: Joi.string()
    .email(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
  telefono: Joi.string().pattern(telefonoPattern)
}).min(1);