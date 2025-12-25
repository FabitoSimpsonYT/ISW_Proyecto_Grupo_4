// src/entities/slot.entity.js
import { EntitySchema } from "typeorm";

export const Slot = new EntitySchema({
  name: "Slot",
  tableName: "slots",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    fecha_hora_inicio: {
      type: "timestamp",
      nullable: false,
    },
    fecha_hora_fin: {
      type: "timestamp",
      nullable: false,
    },
    disponible: {
      type: "boolean",
      default: true,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    evento: {
      target: "Evento",
      type: "many-to-one",
      joinColumn: { name: "evento_id" },
      nullable: false,
    },
    alumno: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "alumno_id" },
      nullable: true,
    },
  },
});