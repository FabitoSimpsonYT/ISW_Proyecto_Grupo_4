import { EntitySchema } from "typeorm";

export const TipoEvento = new EntitySchema({
  name: "TipoEvento",
  tableName: "tipos_eventos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    nombre: {
      type: "varchar",
      length: 100,
      nullable: false,
      unique: true,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    color: {
      type: "varchar",
      length: 7,
      default: "#3b82f6",
    },
    icono: {
      type: "varchar",
      length: 50,
      nullable: true,
      default: "📅",
    },
    activo: {
      type: "boolean",
      default: true,
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