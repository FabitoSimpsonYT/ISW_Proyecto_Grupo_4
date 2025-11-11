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
        criterios:{
            type:"varchar",
            length: 100,
=======
            type:"text",

        },
        distribucionPuntaje:{
            type:"json",
            nullable: false,
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