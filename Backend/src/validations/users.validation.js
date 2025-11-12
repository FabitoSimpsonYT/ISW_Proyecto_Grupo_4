"use strict";
import Joi from "joi";

export const validarRut = (rut) => {
  const [numero, dv] = rut.split('-');
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvEsperado = 11 - resto;
  
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  return dvCalculado.toUpperCase() === dv.toUpperCase();
};

export const createValidation = Joi.object({
    role: Joi.string()
        .valid("admin", "profesor", "alumno")
        .required()
        .messages({
            "any.only": "El rol debe ser 'admin', 'profesor' o 'alumno'",
            "string.empty": "El rol es obligatorio",
            "any.required": "El rol es obligatorio"
        }),
    rut: Joi.string()
        .pattern(/^\d{7,8}-[\dkK]$/)
        .required()
        .custom((value, helpers) => {
            if (!validarRut(value)) {
                return helpers.error("any.invalid");
            }
            return value;
        })
        .messages({
            "string.pattern.base": "El RUT debe tener el formato 12345678-9",
            "string.empty": "El RUT es obligatorio",
            "any.required": "El RUT es obligatorio",
            "any.invalid": "El RUT no es válido"
        }),
    nombres: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            "string.empty": "El nombre es obligatorio",
            "string.min": "El nombre debe tener al menos 2 caracteres",
            "string.max": "El nombre no puede exceder los 255 caracteres",
            "any.required": "El nombre es obligatorio"
        }),
    apellidoPaterno: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            "string.empty": "El apellido paterno es obligatorio",
            "string.min": "El apellido paterno debe tener al menos 2 caracteres",
            "string.max": "El apellido paterno no puede exceder los 255 caracteres",
            "any.required": "El apellido paterno es obligatorio"
        }),
    apellidoMaterno: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            "string.empty": "El apellido materno es obligatorio",
            "string.min": "El apellido materno debe tener al menos 2 caracteres",
            "string.max": "El apellido materno no puede exceder los 255 caracteres",
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
        .pattern(/^(\+569\d{8}|\+5641\d{7})$/)
        .required()
        .custom((value, helpers) => {
            if (value.length > 12) {
                return helpers.message("El teléfono debe contar con máximo 12 caracteres. Por ejemplo: +56912345678 para celular o +56411234567 para fijo");
            }
            if (value.length < 12) {
                return helpers.message("El teléfono debe contar con 12 caracteres. Por ejemplo: +56912345678 para celular o +56411234567 para fijo");
            }
            if (!value.startsWith("+569") && !value.startsWith("+5641")) {
                return helpers.message("El teléfono debe comenzar con +569 para celular o +5641 para fijo");
            }
            return value;
        })
        .messages({
            "string.empty": "El teléfono es obligatorio",
            "any.required": "El teléfono es obligatorio",
            "string.max": "El teléfono no puede tener más de 12 caracteres"
        })
})


export const loginValidation = Joi.object({
    email: Joi.string()
    .email()
    .required()
    .messages({
        "string.email": "El correo electronico debe ser valido.",
        "string.empty": "El correo electronico es obligatorio",
    }),
    password: Joi.string().required().messages({
        "string.empty": "La contraseña no puede estar vacia",
        "any.required": "La contraseña es obligatoria",
    }),
})



