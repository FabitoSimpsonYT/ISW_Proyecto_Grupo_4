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
            // date part (YYYY-MM-DD)
            type: "date",
            nullable: true,
        },
        horaInicio:{
            // start time (HH:mm)
            type: "time",
            nullable: true,
        },
        horaFin:{
            // end time (HH:mm)
            type: "time",
            nullable: true,
        },
        horaProgramada: {
            type: "varchar",
            length: 20,
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
        promedio: {
            type: "float",
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
        ramo:{
            target:"Ramos",
            type:"many-to-one",
            joinColumn: {
                name: "ramo_id",
                referencedColumnName: "id"
            },
            nullable:true,
        },
        pauta:{
            target:"Pauta",
            type:"one-to-one",
            inverseSide:"evaluacion",
            cascade: true,
            nullable:true,
        },
        seccion: {
            target: "Seccion",
            type: "many-to-one",
            joinColumn: {
                name: "seccion_id",
                referencedColumnName: "id",
            },
            nullable: true,
            onDelete: "SET NULL",
        },
       

    },
});

