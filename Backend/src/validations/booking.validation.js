export const createBookingSchema = Joi.object({
  event_id: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'El ID del evento es requerido'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
});

export const updateBookingSchema = Joi.object({
  status: Joi.string()
    .valid('confirmada', 'cancelada', 'completada')
    .required()
    .messages({
      'any.only': 'El estado debe ser confirmada, cancelada o completada',
      'any.required': 'El estado es requerido'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
});