import { EntitySchema } from "typeorm";

export const Seccion = new EntitySchema({
  name: "Seccion",
  tableName: "secciones",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    numero: {
      type: "int",
      nullable: false,
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
    ramo: {
      target: "Ramos",
      type: "many-to-one",
      joinColumn: {
        name: "ramo_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
      nullable: false,
    },
    alumnos: {
      target: "Alumno",
      type: "many-to-many",
      joinTable: {
        name: "seccion_alumnos",
        joinColumn: {
          name: "seccion_id",
          referencedColumnName: "id",
        },
        inverseJoinColumn: {
          name: "alumno_id",
          referencedColumnName: "id",
        },
      },
    },
  },
});