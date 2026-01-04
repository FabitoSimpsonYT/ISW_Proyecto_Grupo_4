import { EntitySchema } from "typeorm";

export const Notificacion = new EntitySchema({
    name: "Notificacion",
    tableName: "notificaciones",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        titulo: {
            type: "varchar",
            length: 255,
        },
        mensaje: {
            type: "text",
        },
        leido: {
            type: "boolean",
            default: false,
        },
        tipo: {
            type: "varchar",
            length: 50,
            default: "evaluacion",
        },
        metadata: {
            type: "text",
            nullable: true,
        },
        fechaEnvio: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
        },
    },
    relations: {
        usuario: {
            target: "User",
            type: "many-to-one",
            joinColumn: true,
            onDelete: "CASCADE",
        },
        evaluacion: {
            target: "Evaluacion",
            type: "many-to-one",
            nullable: true,
            joinColumn: { name: "evaluacion_id" },
            onDelete: "SET NULL",
        },

    },
});