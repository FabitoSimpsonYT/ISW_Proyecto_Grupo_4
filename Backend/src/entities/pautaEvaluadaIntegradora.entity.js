import { EntitySchema } from "typeorm";

export const PautaEvaluadaIntegradora = new EntitySchema({
  name: "PautaEvaluadaIntegradora",
  tableName: "pauta_evaluada_integradora",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    evaluacionIntegradoraId: {
      type: "int",
      nullable: false,
    },
    pautaId: {
      type: "int",
      nullable: false,
    },
    alumnoRut: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    puntajesObtenidos: {
      type: "json",
      nullable: true,
    },
    notaFinal: {
      type: "float",
      nullable: true,
    },
    observaciones: {
      type: "text",
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
    evaluacionIntegradora: {
      type: "many-to-one",
      target: "EvaluacionIntegradora",
      joinColumn: { name: "evaluacion_integradora_id" },
    },
    pauta: {
      type: "many-to-one",
      target: "Pauta",
      joinColumn: { name: "pauta_id" },
    },
    alumno: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "alumno_rut" },
    },
  },
  indices: [
    {
      name: "idx_pauta_evaluada_integradora_alumno_rut",
      columns: ["alumnoRut"],
    },
    {
      name: "idx_pauta_evaluada_integradora_evaluacion_id",
      columns: ["evaluacionIntegradoraId"],
    },
    {
      name: "unique_evaluacion_alumno",
      columns: ["evaluacionIntegradoraId", "alumnoRut"],
      unique: true,
    },
  ],
});
