import Joi from "joi";
import { validarRut } from "./users.validation.js";

export const createProfesorValidation = Joi.object({
  rut: Joi.string()
    .pattern(/^\d{7,8}-[\dkK]$/)
    .custom((value, helpers) => {
      if (!validarRut(value)) {
        return helpers.message('El RUT no es válido (dígito verificador incorrecto)');
      }
      return value;
    })
    .required()
    .messages({
      "string.pattern.base": "El RUT debe tener uno de estos formatos: 12345678-9, 12345678-K, 1234567-8 o 1234567-K",
      "string.empty": "El RUT es obligatorio",
      "any.required": "El RUT es obligatorio"
    }),
  nombres: Joi.string()
    .required()
    .messages({
      "string.empty": "El nombre es obligatorio",
      "any.required": "El nombre es obligatorio"
    }),
  apellidoPaterno: Joi.string()
    .required()
    .messages({
      "string.empty": "El apellido paterno es obligatorio",
      "any.required": "El apellido paterno es obligatorio"
    }),
  apellidoMaterno: Joi.string()
    .required()
    .messages({
      "string.empty": "El apellido materno es obligatorio",
      "any.required": "El apellido materno es obligatorio"
    }),
  email: Joi.string()
    .min(15)
    .max(25)
    .pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .required()
    .messages({
      "string.pattern.base": "El email debe tener el formato usuario@ejemplo.com, ademas que solo debe contener letras, numeros y puntos.",
      "string.min": "El email debe tener al menos 15 caracteres, contando con el dominio.",
      "string.max": "El email no puede exceder los 25 caracteres, contando con el dominio.",
      "string.empty": "El email es obligatorio."
    }),
  password: Joi.string()
    .min(8)
    .max(20)
    .required()
    .messages({
      "string.empty": "La contraseña no puede estar vacia.",
      "any.required": "La contraseña es obligatoria.",
      "string.min": "La contraseña debe tener 8 caracteres como minimo.",
      "string.max": "La contraseña debe tener como maximo 20 caracteres."
    }),
  telefono: Joi.string()
    .pattern(/^\+56(9\d{8}|41\d{7})$/)
    .required()
    .messages({
      "string.pattern.base": "El teléfono debe tener el formato +569XXXXXXXX (móvil con 8 números después del +569) o +5641XXXXXXX (fijo con 7 números después del +5641)",
      "string.empty": "El teléfono es obligatorio",
      "any.required": "El teléfono es obligatorio"
    }),
  especialidad: Joi.string()
    .required()
    .messages({
      "string.empty": "La especialidad es obligatoria",
      "any.required": "La especialidad es obligatoria"
    })
});

export const updateProfesorValidation = Joi.object({
  nombres: Joi.string(),
  apellidoPaterno: Joi.string(),
  apellidoMaterno: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  telefono: Joi.string(),
  especialidad: Joi.string()
}).min(1);