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
        creadaPor: {
            type: "int",
            nullable: true,
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
        pauta:{
            target:"Pauta",
            type:"one-to-one",
            joinColumn: true,
            cascade: true,
            nullable:true,
        },
       
    },
});

