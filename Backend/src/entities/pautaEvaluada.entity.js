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
    alumnoRut: {
      type: "varchar",
      nullable: false,
    },
    idEvaluacion: {
      type: "int",
      nullable: false,
    },
    codigoRamo: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    idPauta: {
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
      nullable: true,
      onDelete: "CASCADE",
    },
    pauta: {
      target: "Pauta",
      type: "many-to-one",
      joinColumn: {
        name: "pauta_id",
        referencedColumnName: "id",
      },
      nullable: true,
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



