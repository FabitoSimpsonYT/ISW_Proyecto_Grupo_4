"use strict";
import Joi from "joi";

// Telefono pattern centralizado: +569XXXXXXXX (móvil) o +5641XXXXXXX (fijo)
export const telefonoPattern = /^(?:\+569\d{8}|\+5641\d{7})$/;

// Función para validar el dígito verificador del RUT
export const validarRut = (rut) => {
  // Separar el RUT del dígito verificador
  const [numero, dv] = rut.split('-');
  
  // Calcular el dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  // Recorrer los dígitos de derecha a izquierda
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  // Calcular el dígito verificador esperado
  const resto = suma % 11;
  const dvEsperado = 11 - resto;
  
  // Convertir el dígito verificador a string (considerando el caso especial del 11 y 10)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  // Comparar con el dígito verificador proporcionado (case insensitive para K)
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
    telefono: Joi.string()
        .pattern(telefonoPattern)
        .required()
        .messages({
            "string.empty": "El teléfono es obligatorio",
            "any.required": "El teléfono es obligatorio",
            "string.pattern.base": "El teléfono debe tener el formato +56912345678 o +56411234567 (12 caracteres)."
        })
});


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



