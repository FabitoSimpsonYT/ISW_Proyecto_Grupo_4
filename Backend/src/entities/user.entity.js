import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    rut: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    nombres: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    apellidoPaterno: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    apellidoMaterno: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 255,
      unique: true,
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    role: {
      type: "enum",
      enum: ["admin", "profesor", "alumno"],
      nullable: false,
    },
    telefono: {
      type: "varchar",
      length: 12,
      unique: true,
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
});
