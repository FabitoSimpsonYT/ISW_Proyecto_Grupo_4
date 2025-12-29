import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";

/**
 * Obtiene el siguiente ID disponible verificando ambas tablas de evaluaciones
 * para evitar conflictos entre evaluaciones normales e integradoras
 * 
 * @param {number} ramoId - ID del ramo (opcional, para mayor validación)
 * @returns {Promise<number>} El siguiente ID disponible
 */
export async function getNextAvailableEvaluacionId(ramoId = null) {
  try {
    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
    const evaluacionIntegradoraRepo = AppDataSource.getRepository(EvaluacionIntegradora);

    // Obtener el máximo ID de evaluaciones normales
    const maxNormal = await evaluacionRepo
      .createQueryBuilder("evaluacion")
      .select("MAX(evaluacion.id)", "max_id")
      .getRawOne();

    const maxNormalId = maxNormal?.max_id ? parseInt(maxNormal.max_id) : 0;

    // Obtener el máximo ID de evaluaciones integradoras
    const maxIntegradora = await evaluacionIntegradoraRepo
      .createQueryBuilder("integradora")
      .select("MAX(integradora.id)", "max_id")
      .getRawOne();

    const maxIntegradoraId = maxIntegradora?.max_id ? parseInt(maxIntegradora.max_id) : 0;

    // Retornar el máximo entre ambas + 1
    return Math.max(maxNormalId, maxIntegradoraId) + 1;
  } catch (error) {
    console.error("Error al obtener siguiente ID de evaluación:", error);
    // En caso de error, retornar un ID seguro basado en timestamp
    return Date.now() % 1000000;
  }
}

/**
 * Verifica si un ID específico está disponible (no existe en ninguna tabla)
 * 
 * @param {number} id - ID a verificar
 * @returns {Promise<boolean>} true si el ID está disponible, false si existe
 */
export async function isEvaluacionIdAvailable(id) {
  try {
    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
    const evaluacionIntegradoraRepo = AppDataSource.getRepository(EvaluacionIntegradora);

    const existsNormal = await evaluacionRepo.findOne({ where: { id } });
    const existsIntegradora = await evaluacionIntegradoraRepo.findOne({ where: { id } });

    return !existsNormal && !existsIntegradora;
  } catch (error) {
    console.error("Error al verificar disponibilidad de ID:", error);
    return false;
  }
}
