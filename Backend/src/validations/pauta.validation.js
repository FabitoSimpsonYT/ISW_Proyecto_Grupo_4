import Joi from "joi";

export const createPautaValidation = Joi.object({
    criterios: Joi.string()
    .min(10)
    .required()
    .messages({
        
        "string.min":"los criterio deben tener el menos 10 caracteres",
        "any.required":"el criterio es obligatorio",
    }),
    distrubucionPuntaje: Joi.string()
    .min(5)
    .required()
    .messages({
         "string.min": "La distribución de puntaje debe tener al menos 5 caracteres",
      "any.required": "la distribución de puntaje es obligatorio",
    }),
    publicada:Joi.string()
    .default(false)
    .messages({
        "boolean.base":"la 'publicada' debe ser verdadero o false",
    }),


})
export const updatePautaValidation = Joi.string({
        criterios:joi.string()
        .min(10)
        .messages({
            "string.min":"los criterios deben ser al menos 10 caracteres",

        }),
        distrubucionPuntaje:joi.string()
        .min(5)
        .messages({
            "string.min":"la distribucion de puntaje debe tener al menos 15 caracteres",

        }),
        publicada:joi.boolean()
        .messages({
            "boolean.base":"la 'publicada' debe ser verdadero o false ",
        }),
});