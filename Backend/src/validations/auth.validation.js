import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
  first_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  last_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'El apellido es requerido'
    }),
  role: Joi.string()
    .valid('profesor', 'alumno', 'coordinador', 'jefecarrera')
    .required()
    .messages({
      'any.only': 'El rol debe ser profesor, alumno, coordinador o jefecarrera',
      'any.required': 'El rol es requerido'
    }),
  rut: Joi.string()
    .pattern(/^[0-9]{7,8}-[0-9Kk]{1}$/)
    .optional()
    .messages({
      'string.pattern.base': 'RUT inválido (formato: 12345678-9)'
    }),
  career: Joi.string().max(100).optional(),
  section: Joi.string().max(50).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es requerida'
    })
});