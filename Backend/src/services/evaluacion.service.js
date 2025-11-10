import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";

const evaluacionRepository = AppDataSource.getRepository(Evaluacion);

export async function getAllEvaluacionesService(user) {
  if (user.role === "profesor") {
    return await evaluacionRepository.find();
  } else {
    return await evaluacionRepository.find({
      select:["titulo", "fechaProgramada", "ponderacion", "estado"],
    });
  }
}

export async function getEvaluacionByIdService(id, user){
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  if (user.role === "alumno") {
    return {
      titulo: evaluacion.titulo,
      fechaProgramada: evaluacion.fechaProgramada,
      ponderacion: evaluacion.ponderacion,
      aplicada: evaluacion.aplicada,
    };
  }

  return evaluacion;
}


export async function createEvaluacionService(data) {
  const nueva = evaluacionRepository.create({ ...data });

  // If pauta is provided as an id, set the relation object so TypeORM can persist it
  if (data.pauta && (typeof data.pauta === "number" || typeof data.pauta === "string")) {
    nueva.pauta = { id: Number(data.pauta) };
  }

  return await evaluacionRepository.save(nueva);
}

export async function updateEvaluacionService(id, data) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  Object.assign(evaluacion, data);
  return await evaluacionRepository.save(evaluacion);
}

export async function deleteEvaluacionService(id, /* userId (currently unused) */) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  await evaluacionRepository.remove(evaluacion);
  return true;
}