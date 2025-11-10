import Joi from "joi";

export const createEvaluacionValidation = Joi.object({
    titulo: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            "string.empty":"el titulo es obligatorio",
            "string.min":"el titulo debe tener al menos 3 caracteres",
            "string.max":"el titulo no puede exceder los 255 caracteres",
            "any.required":"el titulo es obligatorio",
        }),
        fechaProgramada: Joi.date()
        .iso()
        .min(Joi.ref('$tomorrow'))
        .required()
        .messages({
            "date.base": "la fecha programada debe ser una fecha válida",
            "date.min": "la fecha programada debe ser igual o posterior a mañana",
            "any.required": "la fecha programada es obligatoria",
        }),
        ponderacion: Joi.number()
        .min(0)
        .max(100)
        .required()
        .messages({
            "number.base":"la ponderacion debe ser un numero ",
            "number.min":"la ponderacion no puder ser menor a 0",
            "number.max":"la ponderacion no puede superar los 100",
            "any.required":"la ponderacion es obligatorio",
        }),
        contenidos: Joi.string()
        .min(10)
        .required()
        .messages({
            "string.empty":"el campo contenido es obligatorio",
            "string.min":"el contenido debe tener al menos 10 caracteres",
            "any.required":"el contenido es obligatorio",
        }),
        ramo_id: Joi.number()
        .required()
        .messages({
            "number.base":"el id del ramo debe ser un número",
            "any.required":"el id del ramo es obligatorio",
        }),
        estado: Joi.string()
        .valid("pendiente", "realizada", "cancelada")
        .default("pendiente")
         .messages({
            "any.only": "El estado debe ser 'pendiente', 'realizada' o 'cancelada'.",
        }),
        pautaPublicada: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base":"el campo pautapublicada deber ser verdadera o false",
        }),
        pauta: Joi.string()
        .min(0)
        .optional()
        .messages({
            "string.empty":"la pauta es obligatoria ",
            "string.min":"la pauta debe de tener al menos 3 caracteres"
        }),
        
});

export const updateEvaluacionValidation = Joi.object({
    titulo:Joi.string()
    .min(3)
    .max(255)
    .messages({
        "string.min":"el titulo debe terner al menos 3 caracteres",
        "string.max":"elo titulo no puede exceder los 255 caracteres",
    }),
    fechaProgramada:Joi.date()
    .iso()
    .greater("now")
    .messages({
        "date.base":"la fecha programada debe ser valida",
        "date":"debe ser una fecha futura",
    }),
    ponderacion:Joi.number()
    .min(0)
    .max(100)
    .messages({
        "number.min":"la ponderacion no pude ser menor a 0",
        "number.max":"la ponderacion no puede superar los 100",
    }),
    contenidos:Joi.string()
    .min(10)
    .messages({
        "string.min":"los contenidos deben ser al menos 10 caracteres",
    }),
    estado: Joi.string()
    .valid("pendiente","realizado","cancelado")
    .messages({
        "any.only":"el estado debe ser 'pendiente','realizado','cancelado'",

    }),
    PautaPublicada: Joi.boolean()
    .messages({
        "boolean.base":"el campo pautaPublicada debe ser verdadero o false",
    }),
    
});