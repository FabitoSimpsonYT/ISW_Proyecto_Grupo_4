import Joi from "joi";

export const createAlumnoValidation = Joi.object({
  rut: Joi.string()
    .required()
    .messages({
      "string.empty": "El rut es obligatorio",
      "any.required": "El rut es obligatorio"
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
    .email()
    .required()
    .messages({
      "string.email": "El email debe ser válido",
      "string.empty": "El email es obligatorio",
      "any.required": "El email es obligatorio"
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "La contraseña debe tener al menos 6 caracteres",
      "string.empty": "La contraseña es obligatoria",
      "any.required": "La contraseña es obligatoria"
    }),
  telefono: Joi.string()
    .required()
    .messages({
      "string.empty": "El teléfono es obligatorio",
      "any.required": "El teléfono es obligatorio"
    }),
  generacion: Joi.string()
    .required()
    .pattern(/^[0-9]{4}$/)
    .custom((value, helpers) => {
      const year = parseInt(value);
      const currentYear = 2025;
      if (year > currentYear) {
        return helpers.message(`La generación no puede ser superior al año actual (${currentYear})`);
      }
      if (year < 1981) { // Año de fundación de la UBB
        return helpers.message("La generación no puede ser anterior a 1981");
      }
      return value;
    })
    .messages({
      "string.empty": "La generación es obligatoria",
      "any.required": "La generación es obligatoria",
      "string.pattern.base": "La generación debe ser un año válido (YYYY)"
    })
});

export const updateAlumnoValidation = Joi.object({
  nombres: Joi.string(),
  apellidoPaterno: Joi.string(),
  apellidoMaterno: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  telefono: Joi.string(),
  generacion: Joi.string()
}).min(1);
