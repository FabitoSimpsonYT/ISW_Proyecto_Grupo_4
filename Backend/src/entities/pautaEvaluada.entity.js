import { EntitySchema } from "typeorm";

export const PautaEvaluada = new EntitySchema({
  name: "PautaEvaluada",
  tableName: "pautas_evaluadas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    puntajesObtenidos: {
      type: "json",
      nullable: false,
    },
    notaFinal: {
      type: "float",
      nullable: true,
    },
    retroalimentacion: {
      type: "json",
      nullable: true,
      // Use a quoted JSON literal so Postgres receives a valid SQL default
      // Postgres expects a string literal for JSON defaults, e.g. '[]'::json
      default: () => "'[]'::json",
      comment: "Array de objetos con retroalimentaciones del profesor y respuestas del estudiante"
    },
    observaciones: {
      type: "text",
      nullable: true,
      comment: "Observaciones, recomendaciones y sugerencias del profesor"
    },
    creadaPor: {
      type: "int",
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
    evaluacion: {
      target: "Evaluacion",
      type: "many-to-one",
      joinColumn: {
        name: "evaluacion_id",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    alumno: {
      target: "Alumno",
      type: "many-to-one",
      joinColumn: {
        name: "alumno_id",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
