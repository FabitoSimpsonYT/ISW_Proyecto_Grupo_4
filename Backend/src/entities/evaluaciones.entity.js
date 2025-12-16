import {EntitySchema} from "typeorm";

export const Evaluacion = new EntitySchema({
    name: "Evaluacion",
    tableName: "evaluaciones",
    columns:{
        id:{
            primary: true,
            type:"int",
            generated: true,
        },
        titulo :{
            type:"varchar",
            length:255,
        },
        fechaProgramada:{
            type:"date",
            nullable: true,
        },
        horaInicio: {
            type: "varchar",
            length: 5,
            nullable: true,
        },
        horaFin: {
            type: "varchar",
            length: 5,
            nullable: true,
        },
        ponderacion: {
            type:"float",
        },
        contenidos: {
            type:"text",
        },
        estado:{
            type:"enum",
            enum: ["pendiente", "aplicada", "finalizada"],
            default:"pendiente",
            
        },
        pautaPublicada:{
            type: "boolean",
            default:false,
        },
        aplicada: {
            type: "boolean",
            default: false,
        },
        promedio: {
            type: "float",
            default: 0,
        },
        puntajeTotal: {
            type: "int",
            nullable: false,
            default: 0,
        },
        created_at: {
            type: "timestamp",
            createDate: true,
            default: () => "CURRENT_TIMESTAMP",
        },
        updated_at: {
            type: "timestamp",
            updateDate: true,
            default: () => "CURRENT_TIMESTAMP",
        },
        
    },
    relations:{
        ramo: {
            target: "Ramos",
            type: "many-to-one",
            joinColumn: {
                name: "ramo_id",
                referencedColumnName: "id",
            },
            nullable: true,
        },
        pauta:{
            target:"Pauta",
            type:"one-to-one",
            joinColumn: true,
            cascade: true,
            nullable:true,
        },
    },
});

