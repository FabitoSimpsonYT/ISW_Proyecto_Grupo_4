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
<<<<<<< Updated upstream
            type:"varchar",
            length: 100,
=======
            type:"text",
            nullable: true,
>>>>>>> Stashed changes
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
            joinColumn: {
                name: "evaluacion_id",
                referencedColumnName: "id",
            },
            nullable: true,
            onDelete:"CASCADE",
        },
    },
});