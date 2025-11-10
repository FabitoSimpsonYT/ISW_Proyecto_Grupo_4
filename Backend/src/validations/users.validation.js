"use strict";
import Joi from "joi";

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



