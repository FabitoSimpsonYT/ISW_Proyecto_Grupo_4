import { EntitySchema } from "typeorm";

export const Ramos = new EntitySchema({
  name: "Ramos",
  tableName: "ramos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    nombre: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    codigo: {
      type: "varchar",
      length: 10,
      nullable: false,
      unique: true,
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
    profesor: {
      target: "Profesor",
      type: "many-to-one",
      joinColumn: {
        name: "profesor_id",
        referencedColumnName: "id",
      },
      onDelete: "SET NULL",
    },
    secciones: {
      target: "Seccion",
      type: "one-to-many",
      inverseSide: "ramo",
    },
  },
});
