import Joi from "joi";


export const updateEstadoValidation = Joi.object({
  estado: Joi.string()
    .valid("aceptada", "rechazada")
    .required()
    .messages({
      "any.required": "El estado es obligatorio.",
      "any.only": "El estado debe ser 'aceptada' o 'rechazada'."
    }),

  respuestaDocente: Joi.when("estado", {
    is: "aceptada",
    then: Joi.string()
      .trim()
      .min(3)
      .required()
      .messages({
        "any.required": "Debe incluir una respuesta del profesor al aceptar la apelación.",
        "string.empty": "La respuesta del profesor no puede estar vacía.",
        "string.min": "La respuesta debe tener al menos 3 caracteres."
      }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "No se permite incluir una respuesta del profesor al rechazar la apelación."
    })
  }),

  fechaLimiteEdicion: Joi.when("estado", {
    is: "aceptada",
    then: Joi.date().optional(),
    otherwise: Joi.forbidden()
  })
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
      "string.min": "El mensaje debe tener al menos 5 caracteres.",
      "string.max": "El mensaje no puede superar los 1000 caracteres.",
    }),
profesorCorreo: Joi.string()
  .email()
  .required()
  .messages({
    "any.required": "El correo del profesor es obligatorio",
    "string.email": "El correo del profesor debe tener un formato válido",
  }),
});

