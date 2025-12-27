import Joi from "joi";

export const updateEstadoValidation = Joi.object({
  estado: Joi.string()
    .valid("revisada", "aceptada", "rechazada", "cita")
    .required()
    .messages({
      "any.required": "El estado es obligatorio.",
      "any.only": "El estado debe ser revisada, aceptada, rechazada o cita."
    }),

  respuestaDocente: Joi.when("estado", {
    switch: [
      {
        is: "rechazada",
        then: Joi.string()
          .trim()
          .min(3)
          .required()
          .messages({
            "any.required": "El rechazo requiere un mensaje obligatorio.",
            "string.empty": "El mensaje del profesor no puede estar vacío.",
            "string.min": "El mensaje debe tener al menos 3 caracteres."
          }),
      },
      {
        is: "cita",
        then: Joi.string()
          .trim()
          .min(3)
          .required()
          .messages({
            "any.required": "La citación requiere un mensaje explicativo.",
            "string.empty": "El mensaje de citación no puede estar vacío.",
            "string.min": "El mensaje debe tener al menos 3 caracteres."
          }),
      },
      {
        is: "aceptada",
        then: Joi.string()
          .trim()
          .min(3)
          .optional()
          .messages({
            "string.empty": "El mensaje no puede estar vacío.",
            "string.min": "El mensaje debe tener al menos 3 caracteres."
          }),
      }
    ],
    otherwise: Joi.forbidden().messages({
      "any.unknown": "No se permite incluir respuesta del profesor para este estado."
    })
  }),

fechaCitacion: Joi.when("estado", {
  is: "cita",
  then: Joi.date()
    .required()
    .messages({
      "any.required": "La citación requiere una fecha de citación.",
      "date.base": "La fecha de citación debe ser válida."
    }),
  otherwise: Joi.forbidden()
  }),
});



export const createApelacionValidation = Joi.object({
  tipo: Joi.string()
    .valid("evaluacion", "inasistencia", "emergencia")
    .required()
    .messages({
      "any.required": "El tipo de apelación es obligatorio.",
      "any.only": "El tipo debe ser 'evaluacion', 'inasistencia' o 'emergencia'.",
    }),
  mensaje: Joi.string()
    .min(5)
    .max(1000)
    .required()
    .messages({
      "any.required": "Debes escribir un mensaje para tu apelación.",
      "string.empty": "El mensaje no puede estar vacío",
      "string.min": "El mensaje debe tener al menos 5 caracteres.",
      "string.max": "El mensaje no puede superar los 1000 caracteres.",
    }),
profesorCorreo: Joi.string()
  .email()
  .required()
  .messages({
    "any.required": "El correo del profesor es obligatorio",
    "string.empty": "El correo del profesor no puede estar vacío",
    "string.email": "El correo del profesor debe tener un formato válido",
  }),
});

