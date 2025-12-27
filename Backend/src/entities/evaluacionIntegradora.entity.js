import { EntitySchema } from "typeorm";

export const EvaluacionIntegradora = new EntitySchema({
  name: "EvaluacionIntegradora",
  tableName: "evaluacion_integradora",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    ramoId: {
      type: "int",
      nullable: false,
    },
    codigoRamo: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    fechaProgramada: {
      type: "timestamp",
      nullable: true,
    },
    horaInicio: {
      type: "time",
      nullable: true,
    },
    horaFin: {
      type: "time",
      nullable: true,
    },
    puntajeTotal: {
      type: "int",
      nullable: false,
    },
    ponderacion: {
      type: "float",
      default: 40,
    },
    contenidos: {
      type: "text",
      nullable: true,
    },
    estado: {
      type: "varchar",
      length: 20,
      default: "pendiente",
      comment: "'pendiente', 'aplicada', 'completada'",
    },
    pautaPublicada: {
      type: "boolean",
      default: false,
    },
    aplicada: {
      type: "boolean",
      default: false,
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
    ramo: {
      type: "many-to-one",
      target: "Ramos",
      joinColumn: { name: "ramo_id" },
    },
    pauta: {
      type: "one-to-one",
      target: "Pauta",
      joinColumn: true,
      cascade: true,
      nullable: true,
    },
    pautasEvaluadas: {
      type: "one-to-many",
      target: "PautaEvaluadaIntegradora",
      inverseSide: "evaluacionIntegradora",
    },
  },
  indices: [
    {
      name: "idx_evaluacion_integradora_ramo_id",
      columns: ["ramoId"],
    },
  ],
});
