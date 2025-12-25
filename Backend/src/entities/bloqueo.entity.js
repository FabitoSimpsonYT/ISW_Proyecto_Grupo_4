import { EntitySchema } from "typeorm";

export const Bloqueo = new EntitySchema({
  name: "Bloqueo",
  tableName: "bloqueos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    fecha_inicio: {
      type: "date",
      nullable: false,
    },
    fecha_fin: {
      type: "date",
      nullable: false,
    },
    razon: {
      type: "text",
      nullable: true,
    },
    created_by: {
      type: "int",
      nullable: false,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    creador: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "created_by" },
      eager: true,
    },
  },
});