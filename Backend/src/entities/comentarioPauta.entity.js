
import { EntitySchema } from "typeorm";

export const ComentarioPauta = new EntitySchema({
  name: "ComentarioPauta",
  tableName: "comentarios_pauta",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    texto: {
      type: "text",
      nullable: false,
    },
    emisor: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    emisorRut: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    pautaEvaluada: {
      type: "many-to-one",
      target: "PautaEvaluada",
      joinColumn: true,
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
