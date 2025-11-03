import { EntitySchema } from "typeorm";
import { User } from "./user.entity.js";

// Alumno model: joined inheritance via OneToOne PK-FK to users.id
// Strategy: cada Alumno tiene un registro en `users` (base) y datos específicos
// en `alumnos`. La PK de `alumnos` es la misma que la PK del `user`.
export const Profesor = new EntitySchema({
  name: "Profesor",
  tableName: "profesores",
  columns: {
    id: {
      primary: true,
      type: "int",
      // no generated: se reutiliza la PK del User (shared PK)
    },
    especialidad: {
      type: "varchar",
      length: 255,
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
      // joinColumn con nombre `id` para usar la misma PK como FK
      joinColumn: {
        name: "id",
        referencedColumnName: "id",
      },
      cascade: true,
      onDelete: "CASCADE",
      eager: true,
    },
    ramos: {
      target: "Ramos",
      type: "one-to-many",
      inverseSide: "profesor",
    },
  },
});
