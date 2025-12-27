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
        .required()
        .messages({
            "date.base": "la fecha debe ser una fecha válida",
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
        .optional()
        .messages({
            "string.empty":"el código del ramo es obligatorio",
        }),
        ramo_id: Joi.any()
        .optional()
        .messages({
            "any.required":"el ramo es obligatorio",
        }),
        estado: Joi.string()
        .valid("pendiente", "aplicada", "finalizada")
        .default("pendiente")
         .messages({
            "any.only": "El estado debe ser 'pendiente', 'aplicada' o 'finalizada'.",
        }),
        puntajeTotal: Joi.number()
        .min(1)
        .required()
        .messages({
            "number.base": "el puntaje total debe ser un número",
            "number.min": "el puntaje total debe ser al menos 1",
            "any.required": "el puntaje total es obligatorio",
        }),
        pautaPublicada: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base":"el campo pautapublicada deber ser verdadera o false",
        }),
        pauta: Joi.any()
        .optional()
        .messages({
            "string.empty":"la pauta es obligatoria ",
            "string.min":"la pauta debe de tener al menos 3 caracteres"
        }),
        
}).unknown(false);

export const updateEvaluacionValidation = Joi.object({
    id: Joi.any()
    .optional(),
    titulo:Joi.string()
    .min(3)
    .max(255)
    .optional()
    .messages({
        "string.min":"el titulo debe terner al menos 3 caracteres",
        "string.max":"elo titulo no puede exceder los 255 caracteres",
    }),
    fechaProgramada:Joi.date()
    .iso()
    .optional()
    .messages({
        "date.base":"la fecha programada debe ser valida",
    }),
    horaInicio: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
        "string.pattern.base": "la hora de inicio debe estar en formato HH:mm (ej: 10:30)",
    }),
    horaFin: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
        "string.pattern.base": "la hora de fin debe estar en formato HH:mm (ej: 11:30)",
    }),
    ponderacion:Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
        "number.min":"la ponderacion no pude ser menor a 0",
        "number.max":"la ponderacion no puede superar los 100",
    }),
    contenidos:Joi.string()
    .min(10)
    .optional()
    .messages({
        "string.min":"los contenidos deben ser al menos 10 caracteres",
    }),
    puntajeTotal: Joi.number()
    .min(1)
    .optional()
    .messages({
        "number.base": "el puntaje total debe ser un número",
        "number.min": "el puntaje total debe ser al menos 1",
    }),
    estado: Joi.string()
    .valid("pendiente","aplicada","finalizada")
    .optional()
    .messages({
        "any.only":"el estado debe ser 'pendiente','aplicada','finalizada'",
    }),
    pautaPublicada: Joi.boolean()
    .optional()
    .messages({
        "boolean.base":"el campo pautaPublicada debe ser verdadero o false",
    }),
    pauta: Joi.any()
    .optional()
    .messages({
        "string.empty":"la pauta es obligatoria ",
        "string.min":"la pauta debe de tener al menos 3 caracteres"
    }),
    aplicada: Joi.boolean()
    .optional()
    .messages({
        "boolean.base":"el campo aplicada debe ser verdadero o false",
    }),
    ramo_id: Joi.any()
    .optional()
    .messages({
        "any.required":"el ramo es obligatorio",
    }),
    codigoRamo: Joi.string()
    .optional()
    .messages({
        "string.empty":"el código del ramo es obligatorio",
    }),
    promedio: Joi.any()
    .optional(),
    descripcion: Joi.string()
    .optional(),
    fecha: Joi.date()
    .optional(),
    
}).unknown(true);