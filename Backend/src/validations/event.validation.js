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
  start_time: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.min': 'La fecha de inicio debe ser futura',
      'any.required': 'La fecha de inicio es requerida'
    }),
  end_time: Joi.date()
    .iso()
    .greater(Joi.ref('start_time'))
    .required()
    .messages({
      'date.greater': 'La fecha de fin debe ser posterior a la de inicio',
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
  section: Joi.string()
    .max(50)
    .optional()
    .allow(''),
  max_bookings: Joi.number()
    .integer()
    .min(1)
    .default(1)
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  event_type: Joi.string().valid('evaluacion', 'reunion', 'otro').optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().greater(Joi.ref('start_time')).optional(),
  status: Joi.string().valid('tentativo', 'confirmado', 'cancelado').optional(),
  location: Joi.string().max(255).optional().allow(''),
  course: Joi.string().max(100).optional(),
  section: Joi.string().max(50).optional().allow(''),
  max_bookings: Joi.number().integer().min(1).optional(),
  is_available: Joi.boolean().optional()
}).min(1);
