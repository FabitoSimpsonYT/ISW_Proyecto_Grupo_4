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
        .greater("now")
        .required()
        .messages({
            "date.base":"la fecha programada debe de ser fecha valida",
            "date.greater":"la fecha programa debe ser posterior a la fecha anterior",
            "any.required":"la fecha programa es obligatoria",
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
            "string.empty":"el camppo contenido es obligatorio",
            "string.min":"el continido debe tener al menos 10 caracteres",
            "any.required":"el contenido es obligatorio",
        }),
        estado: Joi.string()
        .valid("pendiente", "aplicada", "finalizada")
        .default("pendiente")
         .messages({
            "any.only": "El estado debe ser 'pendiente', 'realizada' o 'cancelada'.",
        }),
        pautaPublicada: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base":"el campo pautapublicada deber ser verdadera o false",
        }),
        pauta: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "La pauta debe ser un número (id de la pauta)",
            "number.integer": "La pauta debe ser un número entero",
            "number.positive": "La pauta debe ser un id válido",
            "any.required": "La pauta es obligatoria"
        }),
        seccion: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "La sección debe ser un número (id de la sección)",
            "number.integer": "La sección debe ser un número entero",
            "number.positive": "La sección debe ser un id válido",
            "any.required": "La sección es obligatoria"
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
    .valid("pendiente","aplicada","finalizada")
    .messages({
        "any.only":"el estado debe ser 'pendiente','aplicada','finalizada'",

    }),
    pautaPublicada: Joi.boolean()
    .messages({
        "boolean.base":"el campo pautaPublicada debe ser verdadero o false",
    }),
    seccion: Joi.number()
    .integer()
    .positive()
    .messages({
        "number.base":"La sección debe ser un número entero",
    }),
        
});