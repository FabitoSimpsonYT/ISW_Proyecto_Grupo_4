import Joi from "joi";

export const createEventSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'El título debe tener al menos 3 caracteres',
      'any.required': 'El título es requerido'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow(''),
  event_type: Joi.string()
    .valid('evaluacion', 'reunion', 'otro')
    .required()
    .messages({
      'any.only': 'El tipo de evento debe ser evaluacion, reunion u otro',
      'any.required': 'El tipo de evento es requerido'
    }),
  start_time: Joi.string()
    .pattern(/^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\d{2} ([01][0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La fecha de inicio debe tener el formato DD-MM-YY HH:mm o DD/MM/YY HH:mm',
      'any.required': 'La fecha de inicio es requerida'
    }),
  end_time: Joi.string()
    .pattern(/^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\d{2} ([01][0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La fecha de fin debe tener el formato DD-MM-YY HH:mm o DD/MM/YY HH:mm',
      'any.required': 'La fecha de fin es requerida'
    }),
  status: Joi.string()
    .valid('tentativo', 'confirmado', 'cancelado')
    .default('tentativo'),
  location: Joi.string()
    .max(255)
    .optional()
    .allow(''),
  course: Joi.string()
    .max(100)
    .required()
    .messages({
      'any.required': 'El curso es requerido'
    }),
  section: Joi.when('event_type', {
    is: 'evaluacion',
    then: Joi.string()
      .max(50)
      .required()
      .pattern(/^[0-9]+$/)
      .messages({
        'any.required': 'La sección es requerida para evaluaciones',
        'string.pattern.base': 'La sección debe ser un número',
        'string.max': 'La sección no puede exceder 50 caracteres'
      }),
    otherwise: Joi.string()
      .max(50)
      .optional()
      .allow('')
  }),
  max_bookings: Joi.number()
    .integer()
    .min(1)
    .default(1)
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  event_type: Joi.string().valid('evaluacion', 'reunion', 'otro').optional(),
  start_time: Joi.string()
    .pattern(/^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\d{2} ([01][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha de inicio debe tener el formato DD-MM-YY HH:mm o DD/MM/YY HH:mm'
    }),
  end_time: Joi.string()
    .pattern(/^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\d{2} ([01][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'La fecha de fin debe tener el formato DD-MM-YY HH:mm o DD/MM/YY HH:mm'
    }),
  status: Joi.string().valid('tentativo', 'confirmado', 'cancelado').optional(),
  location: Joi.string().max(255).optional().allow(''),
  course: Joi.string().max(100).optional(),
  section: Joi.when('event_type', {
    is: 'evaluacion',
    then: Joi.string()
      .max(50)
      .pattern(/^[0-9]+$/)
      .messages({
        'string.pattern.base': 'La sección debe ser un número',
        'string.max': 'La sección no puede exceder 50 caracteres'
      }),
    otherwise: Joi.string()
      .max(50)
      .optional()
      .allow('')
  }),
  max_bookings: Joi.number().integer().min(1).optional(),
  is_available: Joi.boolean().optional()
}).min(1);
