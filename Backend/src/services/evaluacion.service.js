import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";

const evaluacionRepository = AppDataSource.getRepository(Evaluacion); 

export async function getAllEvaluacionesService(user) {
  if (user.role ==="profesor") {
    return await evaluacionRepository.find();
  } else {
    return await evaluacionRepository.find({
      select:["titulo", "fechaProgramada", "ponderacion", "estado"],
    });
  }
}

export async function getEvaluacionByIdService(id, user){
  const evaluacion = await evaluacionRepository.findOneBy(id);

  if (!evaluacion) return null;

  if (user.role ==="estudiante") {
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
  const { titulo, fechaProgramada, ponderacion, contenidos, ramo_id } = data;
  const nueva = evaluacionRepository.create({
    titulo,
    fechaProgramada,
    ponderacion,
    contenidos,
    ramo: { id: ramo_id }
  });
  return await evaluacionRepository.save(nueva);
}

export async function updateEvaluacionService(id, data) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  Object.assign(evaluacion, data);
  return await evaluacionRepository.save(evaluacion);
}

export async function deleteEvaluacionService(id) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  await evaluacionRepository.remove(evaluacion);
  return true;
}