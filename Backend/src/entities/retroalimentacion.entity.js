import { EntitySchema } from "typeorm";

export const Retroalimentacion = new EntitySchema({
  name: "Retroalimentacion",
  tableName: "retroalimentaciones",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: "increment",
    },
    evaluacionId: {
      name: "evaluacion_id",
      type: "int",
      nullable: true,
    },
    evaluacionIntegradoraId: {
      name: "evaluacion_integradora_id",
      type: "int",
      nullable: true,
    },
    profesorId: {
      name: "profesor_id",
      type: "int",
      nullable: false,
    },
    alumnoRut: {
      name: "alumno_rut",
      type: "varchar",
      length: 12,
      nullable: false,
    },
    rutEmisor: {
      name: "rut_emisor",
      type: "varchar",
      length: 12,
      nullable: true,
    },
    rutReceptor: {
      name: "rut_receptor",
      type: "varchar",
      length: 12,
      nullable: true,
    },
    idChat: {
      name: "id_chat",
      type: "varchar",
      length: 100,
      nullable: true,
    },
    ramoId: {
      name: "ramo_id",
      type: "int",
      nullable: false,
    },
    codigoRamo: {
      name: "codigo_ramo",
      type: "varchar",
      length: 20,
      nullable: true,
    },
    mensaje: {
      type: "text",
      nullable: false,
    },
    visto: {
      type: "boolean",
      default: false,
    },
    creadoPor: {
      name: "creado_por",
      type: "int",
      nullable: true,
    },
    createdAt: {
      name: "created_at",
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    evaluacion: {
      target: "Evaluacion",
      type: "many-to-one",
      joinColumn: { name: "evaluacion_id" },
      nullable: true,
    },
    evaluacionIntegradora: {
      target: "EvaluacionIntegradora",
      type: "many-to-one",
      joinColumn: { name: "evaluacion_integradora_id" },
      nullable: true,
    },
    profesor: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "profesor_id" },
    },
    ramo: {
      target: "Ramos",
      type: "many-to-one",
      joinColumn: { name: "ramo_id" },
    },
  },
  indices: [
    {
      columns: ["evaluacionId", "rutEmisor", "rutReceptor"],
    },
    {
      columns: ["evaluacionIntegradoraId", "rutEmisor", "rutReceptor"],
    },
    {
      columns: ["ramoId", "rutEmisor", "rutReceptor", "visto"],
    },
    {
      columns: ["alumnoRut"],
    },
  ],
});
