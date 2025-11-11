import { EntitySchema } from "typeorm";
import { User } from "./user.entity.js";


export const Profesor = new EntitySchema({
  name: "Profesor",
  tableName: "profesores",
  columns: {
    id: {
      primary: true,
      type: "int",
    },
    especialidad: {
      type: "varchar",
      length: 255,
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
    ramos: {
      target: "Ramos",
      type: "one-to-many",
      inverseSide: "profesor",
    },
  },
});
