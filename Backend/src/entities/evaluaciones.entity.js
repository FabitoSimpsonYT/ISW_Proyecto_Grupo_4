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
<<<<<<< Updated upstream
        seccion: {
            target: "Seccion",
            type: "many-to-one",
            joinColumn: {
                name: "seccion_id",
=======
        ramo: {
            target: "Ramos",
            type: "many-to-one",
            joinColumn: {
                name: "codigoRamo",
>>>>>>> Stashed changes
                referencedColumnName: "id",
            },
            nullable: true,
            onDelete: "SET NULL",
        },
<<<<<<< Updated upstream
       
=======
>>>>>>> Stashed changes
    },
});

