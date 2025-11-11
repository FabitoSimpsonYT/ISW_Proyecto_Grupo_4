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
  if (data.seccionId) {
    const seccionExistente = await seccionRepository.findOne({
      where: { id: Number(data.seccionId) }
    });
    if (!seccionExistente) {
      return { error: "La sección especificada no existe" };
    }
  }

  const nueva = evaluacionRepository.create({ ...data });

  if (data.pauta && (typeof data.pauta === "number" || typeof data.pauta === "string")) {
    nueva.pauta = { id: Number(data.pauta) };
  }

  if (data.seccionId && (typeof data.seccionId === "number" || typeof data.seccionId === "string")) {
    nueva.seccion = { id: Number(data.seccionId) };
  }

  const saved = await evaluacionRepository.save(nueva);
 
  const savedWithRelations = await evaluacionRepository.findOne({ where: { id: saved.id }, relations: ["seccion"] });
  
  try {
    if (savedWithRelations && savedWithRelations.seccion && savedWithRelations.seccion.id) {
      await notificarAlumnos(savedWithRelations.seccion.id, `Nueva evaluación: ${savedWithRelations.titulo}`, `Se ha creado una nueva evaluación. Fecha: ${savedWithRelations.fechaProgramada}` , savedWithRelations.id, { bySeccion: true });
    }
  } catch (err) {
    console.error("Error notificando alumnos (createEvaluacion):", err.message || err);
  }

  return savedWithRelations || saved;
    ponderacion,
    contenidos,
    ramo: { id: ramo_id }
  });

  const saved = await evaluacionRepository.save(nueva);
  return await evaluacionRepository.findOne({ where: { id: saved.id }, relations: ["ramo"] });
=======
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