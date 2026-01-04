"use strict";
import { EntitySchema } from "typeorm";
import { User } from "./user.entity.js";
import { PautaEvaluada } from "./pautaEvaluada.entity.js";

export const Apelacion = new EntitySchema({
  name: "Apelacion",
  tableName: "Apelaciones",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    tipo: {
      type: String,
      enum: ["evaluacion", "inasistencia", "emergencia"],
      nullable: false,
    },
    subtipoInasistencia: {
      type: String,
      nullable: true,
    },
    mensaje: {
      type: String,
      nullable: false,
    },
    archivo: {                    
      type: String,
      nullable: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "revisada", "aceptada", "rechazada", "cita"],
      default: "pendiente",
    },
    respuestaDocente: {
      type: String,
      nullable: true,
    },
    fechaCitacion: {
      type: "timestamp",
      nullable: true,
    },
    evaluacionProximaId: {
      type: Number,
      nullable: true,
    },
    fechaLimiteEdicion: {
      type: "timestamp",
      nullable: true,
    },
    puedeEditar: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    alumno: {
      type: "many-to-one",
      target: User,
      joinColumn: { name: "alumnoId" },
      eager: true,
      nullable: false,
    },
    profesor: {
      type: "many-to-one",
      target: User,
      joinColumn: { name: "profesorId" },
      eager: true,
      nullable: false,
    },
    pautaEvaluada: {
      type: "many-to-one",
      target: PautaEvaluada,
      joinColumn: { name: "pautaEvaluadaId" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});
