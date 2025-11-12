import { EntitySchema } from "typeorm";
import { User } from "./user.entity.js";


export const Alumno = new EntitySchema({
  name: "Alumno",
  tableName: "alumnos",
  columns: {
    id: {
      primary: true,
      type: "int",
    },
    generacion: {
      type: "varchar",
      length: 4,
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
    user: {
      target: "User",
      type: "one-to-one",
      joinColumn: {
        name: "id",
        referencedColumnName: "id",
      },
      cascade: true,
      onDelete: "CASCADE",
      eager: true,
    },
    secciones: {
      target: "Seccion",
      type: "many-to-many",
      joinTable: {
        name: "seccion_alumnos",
        joinColumn: {
          name: "alumno_id",
          referencedColumnName: "id"
        },
        inverseJoinColumn: {
          name: "seccion_id",
          referencedColumnName: "id"
        }
      }
    },
  },
});
