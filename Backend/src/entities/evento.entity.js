// src/entities/evento.entity.js
import { EntitySchema } from "typeorm";

export const Evento = new EntitySchema({
  name: "Evento",
  tableName: "eventos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    nombre: {
      type: "varchar",
      length: 150,
      nullable: false,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      enum: ["pendiente", "confirmado", "reagendado", "cancelado"],
      default: "pendiente",
    },
    comentario: {
      type: "text",
      nullable: true,
    },
    fecha_inicio: {
      type: "timestamp",
      nullable: false,
    },
    fecha_fin: {
      type: "timestamp",
      nullable: false,
    },
    modalidad: {
      type: "varchar",
      length: 15,
      enum: ["presencial", "online"],
      nullable: false,
    },
    link_online: {
      type: "varchar",
      length: 500,
      nullable: true,
    },
    duracion_por_alumno: {
      type: "int",
      nullable: true,
    },
    cupo_maximo: {
      type: "int",
      nullable: false,
    },
    cupo_disponible: {
      type: "int",
      nullable: false,
    },
    permite_parejas: {
      type: "boolean",
      default: false,
    },
    sala: {
      type: "varchar",
      length: 100,
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
  relations: {
    tipoEvento: {
      target: "TipoEvento",
      type: "many-to-one",
      joinColumn: { name: "tipo_evento_id" },
      eager: true,
      nullable: false,
    },
    profesor: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "profesor_id" },
      eager: true,
      nullable: false,
    },
    ramo: {
      target: "Ramos",
      type: "many-to-one",
      joinColumn: { name: "ramo_id" },
      nullable: true,
    },
    seccion: {
      target: "Seccion",
      type: "many-to-one",
      joinColumn: { name: "seccion_id" },
      nullable: true,
    },
  },
});