import { AppDataSource } from "../config/configDB.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { PautaEvaluadaIntegradora } from "../entities/pautaEvaluadaIntegradora.entity.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { getNextAvailableEvaluacionId } from "../utils/evaluacion-id.utils.js";

const evaluacionIntegradoraRepo = AppDataSource.getRepository(EvaluacionIntegradora);
const pautaIntegradoraRepo = AppDataSource.getRepository(PautaEvaluadaIntegradora);
const pautaRepo = AppDataSource.getRepository(Pauta);
const ramosRepo = AppDataSource.getRepository(Ramos);
const alumnoRepo = AppDataSource.getRepository(Alumno);

/**
 * Crear evaluación integradora para un ramo
 */
export async function createEvaluacionIntegradoraService(codigoRamo, data) {
  try {
    // Obtener ramo
    const ramo = await ramosRepo.findOne({
      where: { codigo: codigoRamo },
    });

    if (!ramo) {
      return { error: "Ramo no encontrado" };
    }

    // Verificar si ya existe una integradora para este ramo
    const existente = await evaluacionIntegradoraRepo.findOne({
      where: { ramoId: ramo.id },
    });

    if (existente) {
      return { error: "Ya existe una evaluación integradora para este ramo" };
    }

    // Obtener el siguiente ID disponible que no exista en evaluaciones normales ni integradoras
    const nextId = await getNextAvailableEvaluacionId(ramo.id);

    // Crear evaluación integradora
    const evaluacionIntegradora = evaluacionIntegradoraRepo.create({
      id: nextId, // Asignar ID explícitamente para evitar conflictos
      ramoId: ramo.id,
      codigoRamo: codigoRamo,
      titulo: data.titulo || "Evaluación Integradora",
      fechaProgramada: data.fechaProgramada,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      puntajeTotal: data.puntajeTotal,
      ponderacion: data.ponderacion || 40,
      contenidos: data.contenidos || "",
      estado: "pendiente",
      pautaPublicada: false,
      aplicada: false,
      idPauta: data.idPauta || null,
    });

    const guardada = await evaluacionIntegradoraRepo.save(evaluacionIntegradora);

    return { success: true, data: guardada };
  } catch (error) {
    console.error("Error al crear evaluación integradora:", error);
    return { error: error.message };
  }
}

/**
 * Obtener evaluación integradora de un ramo
 */
export async function getEvaluacionIntegradoraService(codigoRamo) {
  try {
    const ramo = await ramosRepo.findOne({
      where: { codigo: codigoRamo },
    });

    if (!ramo) {
      return { error: "Ramo no encontrado" };
    }

    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { ramoId: ramo.id },
      relations: ["pautasEvaluadas", "ramo"],
    });

    if (!evaluacionIntegradora) {
      return { success: true, data: null };
    }

    return { success: true, data: evaluacionIntegradora };
  } catch (error) {
    console.error("Error al obtener evaluación integradora:", error);
    return { error: error.message };
  }
}

/**
 * Actualizar evaluación integradora
 */
export async function updateEvaluacionIntegradoraService(evaluacionId, data) {
  try {
    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { id: evaluacionId },
    });

    if (!evaluacionIntegradora) {
      return { error: "Evaluación integradora no encontrada" };
    }

    if (data.titulo) evaluacionIntegradora.titulo = data.titulo;
    if (data.fechaProgramada) evaluacionIntegradora.fechaProgramada = data.fechaProgramada;
    if (data.horaInicio) evaluacionIntegradora.horaInicio = data.horaInicio;
    if (data.horaFin) evaluacionIntegradora.horaFin = data.horaFin;
    if (data.ponderacion !== undefined) evaluacionIntegradora.ponderacion = data.ponderacion;
    if (data.estado !== undefined) evaluacionIntegradora.estado = data.estado;
    if (data.pautaPublicada !== undefined) evaluacionIntegradora.pautaPublicada = data.pautaPublicada;

    const actualizada = await evaluacionIntegradoraRepo.save(evaluacionIntegradora);

    return { success: true, data: actualizada };
  } catch (error) {
    console.error("Error al actualizar evaluación integradora:", error);
    return { error: error.message };
  }
}

/**
 * Eliminar evaluación integradora
 */
export async function deleteEvaluacionIntegradoraService(evaluacionId) {
  try {
    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { id: evaluacionId },
    });

    if (!evaluacionIntegradora) {
      return { error: "Evaluación integradora no encontrada" };
    }

    // 1. Buscar y eliminar todas las pautas evaluadas integradora asociadas
    console.log("Buscando pautas evaluadas para evaluación integradora:", evaluacionId);
    const pautasEvaluadas = await pautaIntegradoraRepo.find({
      where: { evaluacionIntegradoraId: evaluacionId },
    });
    
    if (pautasEvaluadas && pautasEvaluadas.length > 0) {
      console.log("Eliminando", pautasEvaluadas.length, "pautas evaluadas integradora");
      await pautaIntegradoraRepo.remove(pautasEvaluadas);
    }

    // 2. Buscar y eliminar la pauta asociada a la evaluación integradora
    console.log("Buscando pauta asociada a evaluación integradora:", evaluacionId);
    const pauta = await pautaRepo.findOne({
      where: { evaluacionIntegradoraId: evaluacionId },
    });
    
    if (pauta) {
      console.log("Eliminando pauta integradora con ID:", pauta.id);
      await pautaRepo.remove(pauta);
    }

    // 3. Eliminar la evaluación integradora
    console.log("Eliminando evaluación integradora con ID:", evaluacionId);
    await evaluacionIntegradoraRepo.remove(evaluacionIntegradora);

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar evaluación integradora:", error);
    return { error: error.message };
  }
}

/**
 * Crear pauta evaluada integradora para un alumno
 */
export async function createPautaIntegradoraService(evaluacionIntegradoraId, alumnoRut, data) {
  try {
    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { id: evaluacionIntegradoraId },
    });

    if (!evaluacionIntegradora) {
      return { error: "Evaluación integradora no encontrada" };
    }

    // Verificar si ya existe
    const existente = await pautaIntegradoraRepo.findOne({
      where: { evaluacionIntegradoraId, alumnoRut },
    });

    if (existente) {
      return { error: "Ya existe una pauta evaluada para este alumno" };
    }

    const pautaIntegradora = pautaIntegradoraRepo.create({
      evaluacionIntegradoraId,
      alumnoRut,
      notaFinal: data.notaFinal || null,
      observaciones: data.observaciones || null,
    });

    const guardada = await pautaIntegradoraRepo.save(pautaIntegradora);

    return { success: true, data: guardada };
  } catch (error) {
    console.error("Error al crear pauta integradora:", error);
    return { error: error.message };
  }
}

/**
 * Actualizar pauta evaluada integradora
 */
export async function updatePautaIntegradoraService(pautaIntegradoraId, data) {
  try {
    const pautaIntegradora = await pautaIntegradoraRepo.findOne({
      where: { id: pautaIntegradoraId },
    });

    if (!pautaIntegradora) {
      return { error: "Pauta integradora no encontrada" };
    }

    if (data.notaFinal !== undefined) pautaIntegradora.notaFinal = data.notaFinal;
    if (data.observaciones !== undefined) pautaIntegradora.observaciones = data.observaciones;

    const actualizada = await pautaIntegradoraRepo.save(pautaIntegradora);

    return { success: true, data: actualizada };
  } catch (error) {
    console.error("Error al actualizar pauta integradora:", error);
    return { error: error.message };
  }
}

/**
 * Obtener pautas integradoras de una evaluación integradora
 */
export async function getPautasIntegradorasService(evaluacionIntegradoraId) {
  try {
    const pautas = await pautaIntegradoraRepo.find({
      where: { evaluacionIntegradoraId },
    });

    return { success: true, data: pautas };
  } catch (error) {
    console.error("Error al obtener pautas integradoras:", error);
    return { error: error.message };
  }
}

/**
 * Obtener nota integradora de un alumno en un ramo
 */
export async function getNotaIntegradoraAlumnoService(codigoRamo, alumnoRut) {
  try {
    const ramo = await ramosRepo.findOne({
      where: { codigo: codigoRamo },
    });

    if (!ramo) {
      return { error: "Ramo no encontrado" };
    }

    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { ramoId: ramo.id },
    });

    if (!evaluacionIntegradora) {
      return { success: true, data: null };
    }

    const pautaIntegradora = await pautaIntegradoraRepo.findOne({
      where: { evaluacionIntegradoraId: evaluacionIntegradora.id, alumnoRut },
    });

    return { success: true, data: pautaIntegradora };
  } catch (error) {
    console.error("Error al obtener nota integradora:", error);
    return { error: error.message };
  }
}
