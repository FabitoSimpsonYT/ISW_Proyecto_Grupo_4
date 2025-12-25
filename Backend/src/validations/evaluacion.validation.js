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
            "date.base": "la fecha debe ser una fecha válida",
            "date.min": "la fecha debe ser igual o posterior a mañana",
            "any.required": "la fecha es obligatoria",
        }),
        horaInicio: Joi.string()
        .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            "string.pattern.base": "la hora de inicio debe estar en formato HH:mm (ej: 10:30)",
            "any.required": "la hora de inicio es obligatoria",
        }),
        horaFin: Joi.string()
        .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            "string.pattern.base": "la hora de fin debe estar en formato HH:mm (ej: 11:30)",
            "any.required": "la hora de fin es obligatoria",
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
        codigoRamo: Joi.string()
        .required()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .messages({
            "string.empty":"el código del ramo es obligatorio",
            "string.length":"el código del ramo debe tener exactamente 6 caracteres",
            "string.pattern.base":"el código del ramo debe contener solo números",
            "any.required":"el código del ramo es obligatorio",
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
        
}).unknown(false);

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