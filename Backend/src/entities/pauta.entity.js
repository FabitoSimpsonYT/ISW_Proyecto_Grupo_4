import { EntitySchema } from "typeorm";

export const Pauta = new EntitySchema({
    name:"Pauta",
    tableName:"pautas",
    columns:{
        id:{
            primary: true,
            type: "int",
            generated: true,
        },
        evaluacionId: {
            type: "int",
            nullable: true,
        },
        evaluacionIntegradoraId: {
            type: "int",
            nullable: true,
        },
        criterios: {
            type: "text",
        },
        distribucionPuntaje:{
            type:"json",
            nullable: false,
        },
        publicada: {
            type: "boolean",
            default: false,
        },
    },
    relations:{
        evaluacion:{
            target:"Evaluacion",
            type:"one-to-one",
            inverseSide:"pauta",
            joinColumn: true,
            onDelete:"CASCADE",
        },
    },
});