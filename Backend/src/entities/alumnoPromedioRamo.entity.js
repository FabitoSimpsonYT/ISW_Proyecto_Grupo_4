import { EntitySchema } from "typeorm";

export const AlumnoPromedioRamo = new EntitySchema({
  name: "AlumnoPromedioRamo",
  tableName: "alumno_promedio_ramo",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    alumnoRut: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    ramoId: {
      type: "int",
      nullable: false,
    },
    promedioFinal: {
      type: "float",
      nullable: true,
      comment: "NULL si pendiente, valor numérico si calculado",
    },
    promedioOficial: {
      type: "numeric",
      precision: 3,
      scale: 1,
      nullable: true,
      comment: "Redondeado a 1 decimal",
    },
    promedioParcial: {
      type: "float",
      nullable: true,
      comment: "Promedio sin contar evaluación integradora",
    },
    notaIntegradora: {
      type: "float",
      nullable: true,
      comment: "Nota de la evaluación integradora",
    },
    estado: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "pendiente",
      comment: "'pendiente', 'aprobado', 'reprobado'",
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
  indices: [
    {
      columns: ["alumnoRut", "ramoId"],
      unique: true,
    },
    {
      columns: ["alumnoRut"],
    },
    {
      columns: ["ramoId"],
    },
    {
      columns: ["estado"],
    },
  ],
  relations: {
    alumno: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "alumno_rut",
        referencedColumnName: "rut",
      },
      onDelete: "CASCADE",
    },
    ramo: {
      target: "Ramos",
      type: "many-to-one",
      joinColumn: {
        name: "ramo_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
});
