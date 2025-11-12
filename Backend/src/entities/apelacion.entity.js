"use strict";
import { EntitySchema } from "typeorm";
import { User } from "./user.entity.js";

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
    mensaje: {
      type: String,
      nullable: false,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aceptada", "rechazada"],
      default: "pendiente",
    },
    respuestaDocente: {
      type: String,
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
      nullable: false, // profesor puede ser null en emergencias
    },
  },
});
