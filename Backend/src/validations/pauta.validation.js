import Joi from "joi";

export const createPautaValidation = Joi.object({
    criterios: Joi.string()
        .required()
        .min(3)
        .pattern(/^[^,]+(?:,\s*[^,]+)*$/)
        .messages({
            "string.min": "Los criterios deben tener al menos 3 caracteres",
            "string.pattern.base": "Los criterios deben estar separados por comas",
            "any.required": "Los criterios son obligatorios"
        }),
    distribucionPuntaje: Joi.object()
        .pattern(
            Joi.string(),
            Joi.number().min(0).max(100)
        )
        .required()
        .messages({
            "object.base": "La distribución de puntaje debe ser un objeto JSON",
            "any.required": "La distribución de puntaje es obligatoria",
            "number.min": "Los puntajes deben ser mayores o iguales a 0",
            "number.max": "Los puntajes no pueden superar 100"
        }),
    publicada: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base": "El campo 'publicada' debe ser verdadero o falso"
        }),


})
export const updatePautaValidation = Joi.object({
    criterios: Joi.string()
        .min(3)
        .pattern(/^[^,]+(?:,\s*[^,]+)*$/)
        .messages({
            "string.min": "Los criterios deben tener al menos 3 caracteres",
            "string.pattern.base": "Los criterios deben estar separados por comas"
        }),
    distribucionPuntaje: Joi.object()
        .pattern(
            Joi.string(),
            Joi.number().min(0).max(100)
        )
        .messages({
            "object.base": "La distribución de puntaje debe ser un objeto JSON",
            "number.min": "Los puntajes deben ser mayores o iguales a 0",
            "number.max": "Los puntajes no pueden superar 100"
        }),
    publicada: Joi.boolean()
        .messages({
            "boolean.base": "El campo 'publicada' debe ser verdadero o falso"
        }),
});