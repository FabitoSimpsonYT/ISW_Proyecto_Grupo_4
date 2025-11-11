import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Seccion } from "../entities/seccion.entity.js";
import { notificarAlumnos } from "./notificacion.service.js";

const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
const seccionRepository = AppDataSource.getRepository(Seccion);

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
  const evaluacion = await evaluacionRepository.findOne({
    where: { id },
    relations: ["pauta", "seccion"],
  });

  if (!evaluacion) return null;

  if (user.role === "alumno") {
    return {
      titulo: evaluacion.titulo,
      fechaProgramada: evaluacion.fechaProgramada,
      ponderacion: evaluacion.ponderacion,
      aplicada: evaluacion.aplicada,
      contenidos: evaluacion.contenidos,
    };
  }

  return evaluacion;
}


export async function createEvaluacionService(data) {
<<<<<<< Updated upstream
  // Verificar si la sección existe antes de crear la evaluación
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
  // Refrescar con relaciones
  const savedWithRelations = await evaluacionRepository.findOne({ where: { id: saved.id }, relations: ["seccion"] });
  // Notificar alumnos inscritos en la sección si existe
  try {
    if (savedWithRelations && savedWithRelations.seccion && savedWithRelations.seccion.id) {
      await notificarAlumnos(savedWithRelations.seccion.id, `Nueva evaluación: ${savedWithRelations.titulo}`, `Se ha creado una nueva evaluación. Fecha: ${savedWithRelations.fechaProgramada}` , savedWithRelations.id, { bySeccion: true });
    }
  } catch (err) {
    // no bloquear la creación por fallo en notificaciones
    console.error("Error notificando alumnos (createEvaluacion):", err.message || err);
  }

  return savedWithRelations || saved;
=======
  const { titulo, fechaProgramada, horaProgramada, ponderacion, contenidos, ramo_id } = data;
  const nueva = evaluacionRepository.create({
    titulo,
    fechaProgramada,
    horaProgramada,
    ponderacion,
    contenidos,
    ramo: { id: ramo_id }
  });
  const saved = await evaluacionRepository.save(nueva);
  return await evaluacionRepository.findOne({ where: { id: saved.id }, relations: ["ramo"] });
>>>>>>> Stashed changes
}

export async function updateEvaluacionService(id, data) {
  const evaluacion = await evaluacionRepository.findOne({ where: { id }, relations: ["seccion"] });

  if (!evaluacion) return null;

  // No permitir editar si ya fue aplicada o no está pendiente
  if (evaluacion.aplicada === true || evaluacion.estado !== "pendiente") {
    return { error: "No se puede editar una evaluación ya aplicada o no pendiente." };
  }

  if (data.pauta && (typeof data.pauta === "number" || typeof data.pauta === "string")) {
    evaluacion.pauta = { id: Number(data.pauta) };
  }

  if (data.seccion && (typeof data.seccion === "number" || typeof data.seccion === "string")) {
    evaluacion.seccion = { id: Number(data.seccion) };
  }

  Object.assign(evaluacion, data);
  const updated = await evaluacionRepository.save(evaluacion);
  const updatedWithRelations = await evaluacionRepository.findOne({ where: { id: updated.id }, relations: ["seccion"] });
  try {
    if (updatedWithRelations && updatedWithRelations.seccion && updatedWithRelations.seccion.id) {
      await notificarAlumnos(updatedWithRelations.seccion.id, `Evaluación modificada: ${updatedWithRelations.titulo}`, `Se ha modificado la evaluación. Revise los detalles.`, updatedWithRelations.id, { bySeccion: true });
    }
  } catch (err) {
    console.error("Error notificando alumnos (updateEvaluacion):", err.message || err);
  }

  return updatedWithRelations || updated;
}

export async function deleteEvaluacionService(id) {
  const evaluacion = await evaluacionRepository.findOne({ where: { id }, relations: ["seccion"] });

  if (!evaluacion) return null;

  // No permitir eliminar si ya fue aplicada o no está pendiente
  if (evaluacion.aplicada === true || evaluacion.estado !== "pendiente") {
    return { error: "No se puede eliminar una evaluación ya aplicada o no pendiente." };
  }

  const seccionId = evaluacion.seccion ? evaluacion.seccion.id : null;
  const titulo = evaluacion.titulo;

  await evaluacionRepository.remove(evaluacion);

  try {
    if (seccionId) {
      await notificarAlumnos(seccionId, `Evaluación eliminada: ${titulo}`, `Una evaluación ha sido eliminada de la sección.`, null, { bySeccion: true });
    }
  } catch (err) {
    console.error("Error notificando alumnos (deleteEvaluacion):", err.message || err);
  }

  return true;
}