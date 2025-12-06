import Joi from "joi";

export const createPautaValidation = Joi.object({
    criterios: Joi.string()
        .min(10)
        .required()
        .messages({
            "string.min": "los criterios deben tener al menos 10 caracteres",
            "any.required": "el criterio es obligatorio",
        }),
    distribucionPuntaje: Joi.string()
        .min(5)
        .required()
        .messages({
            "string.min": "La distribución de puntaje debe tener al menos 5 caracteres",
            "any.required": "la distribución de puntaje es obligatorio",
        }),
    publicada: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base": "la 'publicada' debe ser verdadero o falso",
        }),
});

export const updatePautaValidation = Joi.object({
    criterios: Joi.string()
        .min(10)
        .messages({
            "string.min": "los criterios deben ser al menos 10 caracteres",
        }),
    distribucionPuntaje: Joi.string()
        .min(5)
        .messages({
            "string.min": "la distribucion de puntaje debe tener al menos 5 caracteres",
        }),
    publicada: Joi.boolean()
        .messages({
            "boolean.base": "la 'publicada' debe ser verdadero o falso",
        }),
});