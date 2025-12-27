import { AppDataSource } from "../config/configDb.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { PautaEvaluadaIntegradora } from "../entities/pautaEvaluadaIntegradora.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { guardarPromedioFinal } from "./alumnoPromedioRamo.service.js";

const pautaEvaluadaRepository = AppDataSource.getRepository(PautaEvaluada);
const pautaEvaluadaIntegradoraRepository = AppDataSource.getRepository(PautaEvaluadaIntegradora);
const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
const evaluacionIntegradoraRepository = AppDataSource.getRepository(EvaluacionIntegradora);
const pautaRepository = AppDataSource.getRepository(Pauta);
const alumnoRepository = AppDataSource.getRepository(Alumno);

/**
 * Obtiene todas las evaluaciones y notas de un alumno
 * @param {number} alumnoId - ID del alumno
 * @returns {Promise<Array>} Array con nombre de evaluación y nota
 */
export async function obtenerEvaluacionesYNotasAlumno(alumnoId) {
  const pautasEvaluadas = await pautaEvaluadaRepository.find({
    where: { alumno: { id: alumnoId } },
    relations: ["evaluacion"],
    select: {
      notaFinal: true,
      evaluacion: {
        id: true,
        nombre: true
      }
    }
  });

  return pautasEvaluadas.map(pauta => ({
    evaluacion: pauta.evaluacion.nombre,
    nota: pauta.notaFinal
  }));
}

function calcNotaFinal(distribucionPuntaje, puntajesObtenidos) {
  const claves = Object.keys(distribucionPuntaje);
  let sumaMax = 0;
  let sumaObtenida = 0;
  for (const clave of claves) {
    const maximo = Number(distribucionPuntaje[clave]) || 0;
    const obtenido = Number(puntajesObtenidos[clave]) || 0;
    sumaMax += maximo;
    sumaObtenida += obtenido;
  }
  if (sumaMax === 0) return 0;
  const porcentaje = (sumaObtenida / sumaMax) * 100;

  const porcentajeAcotado = Math.max(0, Math.min(100, porcentaje));

  let nota;
  const minimoParaAprobar = 51;
  if (porcentajeAcotado < minimoParaAprobar) {
    nota = 1.0 + (porcentajeAcotado / minimoParaAprobar) * (4.0 - 1.0);
    if (nota >= 4.0) nota = 3.99;
  } else {
    const denominador = 100 - minimoParaAprobar;
    nota = 4.0 + ((porcentajeAcotado - minimoParaAprobar) / (denominador === 0 ? 1 : denominador)) * (7.0 - 4.0);
  }


  const dosDecimales = Math.round(nota * 100) / 100;
  const segundoDigito = Math.floor((dosDecimales * 100) % 10);

  if (segundoDigito === 0) {
    return Number(dosDecimales.toFixed(1));
  }

  if (segundoDigito >= 5) {
    const redondeadoUno = Math.round(dosDecimales * 10) / 10;
    return Number(redondeadoUno.toFixed(1));
  }

  const truncadoUno = Math.floor(dosDecimales * 10) / 10;
  return Number(truncadoUno.toFixed(1));
}

export async function createPautaEvaluadaService(evaluacionId, pautaId, alumnoRut, data, user) {
  // Obtener evaluación con su ramo
  let evaluacion = null;
  try {
    evaluacion = await evaluacionRepository
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.ramo", "ramo")
      .leftJoinAndSelect("e.pauta", "pauta")
      .where("e.id = :evaluacionId", { evaluacionId })
      .getOne();
      
    if (!evaluacion) return { error: "Evaluación no encontrada" };
  } catch (err) {
    console.error("Error al obtener evaluación:", err);
  }

  // Obtener pauta desde pautaId en params
  let pauta = null;
  if (pautaId) {
    pauta = await pautaRepository.findOneBy({ id: parseInt(pautaId) });
    if (!pauta) return { error: "Pauta no encontrada" };
  } else {
    // Si no hay pautaId, intentar obtener pauta de la evaluación (compatibilidad hacia atrás)
    if (!evaluacion) return { error: "Evaluación no encontrada" };
    if (!evaluacion.pauta) return { error: "La evaluación no tiene una pauta definida" };
    
    pauta = evaluacion.pauta;
  }

  // Obtener alumno a través de la relación con User (que tiene el rut)
  const alumno = await alumnoRepository
    .createQueryBuilder("a")
    .leftJoinAndSelect("a.user", "u")
    .where("u.rut = :rut", { rut: alumnoRut })
    .getOne();
    
  if (!alumno) return { error: "Alumno no encontrado" };

  const existing = await pautaEvaluadaRepository
    .createQueryBuilder("pe")
    .leftJoinAndSelect("pe.alumno", "a")
    .leftJoinAndSelect("a.user", "u")
    .where("pe.evaluacion_id = :evaluacionId", { evaluacionId })
    .andWhere("u.rut = :rut", { rut: alumnoRut })
    .getOne();
    
  if (existing) return { error: "Ya existe una pauta evaluada para este alumno en la evaluación" };

  const distribucion = pauta.distribucionPuntaje || {};
  const puntajes = data.puntajes_obtenidos || {};

  const nota = calcNotaFinal(distribucion, puntajes);

  const pautaEval = pautaEvaluadaRepository.create({
    puntajesObtenidos: puntajes,
    notaFinal: nota,
    observaciones: data.observaciones || null,
    retroalimentacion: [],
    creadaPor: user?.id || null,
    alumnoRut: alumnoRut,
    codigoRamo: data.codigoRamo || null,
    idEvaluacion: data.idEvaluacion || evaluacionId,
    idPauta: data.idPauta || pauta.id,
    evaluacion: { id: evaluacionId },
    pauta: { id: pauta.id },
    alumno: { id: alumno.id },
  });

  const saved = await pautaEvaluadaRepository.save(pautaEval);
  await updateEvaluacionPromedio(evaluacionId);

  // Guardar promedio final del alumno en el ramo (si evaluacion tiene ramo)
  if (evaluacion && evaluacion.ramo && evaluacion.ramo.codigo) {
    try {
      await guardarPromedioFinal(alumnoRut, evaluacion.ramo.codigo);
    } catch (err) {
      console.error("Error al guardar promedio final:", err);
      // No falla la calificación si hay error en promedio
    }
  }

  return saved;
}


export async function getPautaEvaluadaService(evaluacionId, alumnoRut) {
  const pauta = await pautaEvaluadaRepository
    .createQueryBuilder("pe")
    .leftJoinAndSelect("pe.alumno", "a")
    .leftJoinAndSelect("a.user", "u")
    .leftJoinAndSelect("pe.evaluacion", "e")
    .leftJoinAndSelect("pe.pauta", "p")
    .where("pe.evaluacion_id = :evaluacionId", { evaluacionId })
    .andWhere("u.rut = :rut", { rut: alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada no encontrada" };
  return pauta;
}

export async function getPautasEvaluadasByEvaluacionService(evaluacionId) {
  try {
    const pautas = await pautaEvaluadaRepository
      .createQueryBuilder("pe")
      .leftJoinAndSelect("pe.alumno", "a")
      .leftJoinAndSelect("a.user", "u")
      .leftJoinAndSelect("pe.evaluacion", "e")
      .leftJoinAndSelect("pe.pauta", "p")
      .where("pe.evaluacion_id = :evaluacionId", { evaluacionId })
      .getMany();

    if (!pautas || pautas.length === 0) {
      return { error: "No hay pautas evaluadas para esta evaluación" };
    }

    return pautas;
  } catch (error) {
    console.error("Error al obtener pautas evaluadas:", error);
    return { error: "Error al obtener pautas evaluadas" };
  }
}

async function updateEvaluacionPromedio(evaluacionId) {
  const qb = pautaEvaluadaRepository.createQueryBuilder('pe')
    .select('AVG(pe.notaFinal)', 'avg')
    .where('pe.evaluacion_id = :evaluacionId', { evaluacionId });

  const result = await qb.getRawOne();
  const avg = result && result.avg ? Number(result.avg) : 0;

  await evaluacionRepository.update({ id: evaluacionId }, { promedio: avg });
  return avg;
}


export async function obtenerPromedioPorEvaluacion(evaluacionId) {
  const qb = pautaEvaluadaRepository.createQueryBuilder('pe')
    .select('AVG(pe.notaFinal)', 'avg')
    .where('pe.evaluacion_id = :evaluacionId', { evaluacionId });

  const result = await qb.getRawOne();
  const avg = result && result.avg !== null ? Number(result.avg) : null;
  return avg;
}

/**
 * Obtiene el promedio (AVG) de las notas finales para un alumno en todas sus evaluaciones.
 * Devuelve null si el alumno no tiene notas.
 */
export async function obtenerPromedioPorAlumno(alumnoId) {
  const qb = pautaEvaluadaRepository.createQueryBuilder('pe')
    .select('AVG(pe.notaFinal)', 'avg')
    .where('pe.alumno_id = :alumnoId', { alumnoId });

  const result = await qb.getRawOne();
  const avg = result && result.avg !== null ? Number(result.avg) : null;
  return avg;
}

export async function obtenerPromedioGeneralPorRamo(ramoId) {
  const sql = `
    SELECT AVG(student_avg) as course_avg FROM (
      SELECT pe.alumno_id, AVG(pe.notaFinal) as student_avg
      FROM pautas_evaluadas pe
      JOIN evaluaciones e ON pe.evaluacion_id = e.id
      WHERE e.ramo_id = ?
      GROUP BY pe.alumno_id
    ) t
  `;

  const rows = await AppDataSource.manager.query(sql, [ramoId]);
  const courseAvg = rows && rows[0] && rows[0].course_avg !== null ? Number(rows[0].course_avg) : null;
  return courseAvg;
}

export async function updatePautaEvaluadaService(evaluacionId, alumnoRut, data, user) {
  // Buscar la pautaEvaluada por evaluacionId y alumnoRut
  const pauta = await pautaEvaluadaRepository
    .createQueryBuilder("pe")
    .leftJoinAndSelect("pe.alumno", "a")
    .leftJoinAndSelect("a.user", "u")
    .leftJoinAndSelect("pe.pauta", "p")
    .where("pe.evaluacion_id = :evaluacionId", { evaluacionId })
    .andWhere("u.rut = :rut", { rut: alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada no encontrada" };

  if (user.role !== "admin" && pauta.creadaPor !== user.id) {
    return { error: "No tienes permiso para modificar esta pauta evaluada" };
  }

  // Actualizar puntajes si se proporcionan
  if (data.puntajes_obtenidos) {
    pauta.puntajesObtenidos = data.puntajes_obtenidos;
  }

  // Actualizar observaciones si se proporcionan
  if (data.observaciones !== undefined) {
    pauta.observaciones = data.observaciones;
  }

  // Actualizar campos identificadores si se proporcionan (aunque normalmente no cambien)
  if (data.alumnoRut !== undefined) {
    pauta.alumnoRut = data.alumnoRut;
  }
  if (data.idPauta !== undefined) {
    pauta.idPauta = data.idPauta;
  }
  if (data.idEvaluacion !== undefined) {
    pauta.idEvaluacion = data.idEvaluacion;
  }
  if (data.codigoRamo !== undefined) {
    pauta.codigoRamo = data.codigoRamo;
  }

  // Recalcular la nota automáticamente basándose en los puntajes actuales
  const distribucion = pauta.pauta?.distribucionPuntaje || {};
  const puntajesActuales = pauta.puntajesObtenidos || {};
  const notaCalculada = calcNotaFinal(distribucion, puntajesActuales);
  pauta.notaFinal = notaCalculada;

  const saved = await pautaEvaluadaRepository.save(pauta);

  await updateEvaluacionPromedio(evaluacionId);

  return saved;
}

export async function deletePautaEvaluadaService(evaluacionId, alumnoRut, user) {
  // Buscar la pautaEvaluada por evaluacionId y alumnoRut
  const pauta = await pautaEvaluadaRepository
    .createQueryBuilder("pe")
    .leftJoinAndSelect("pe.alumno", "a")
    .leftJoinAndSelect("a.user", "u")
    .where("pe.evaluacion_id = :evaluacionId", { evaluacionId })
    .andWhere("u.rut = :rut", { rut: alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada no encontrada" };

  if (user.role !== "admin" && pauta.creadaPor !== user.id) {
    return { error: "No tienes permiso para eliminar esta pauta evaluada" };
  }

  await pautaEvaluadaRepository.remove(pauta);

  await updateEvaluacionPromedio(evaluacionId);

  return { message: "Pauta evaluada eliminada exitosamente" };
}

// ========== INTEGRADORA ==========

export async function createPautaEvaluadaIntegradoraService(evaluacionIntegradoraId, pautaId, alumnoRut, data, user) {
  // Obtener evaluación integradora
  let evaluacionIntegradora = null;
  try {
    evaluacionIntegradora = await evaluacionIntegradoraRepository.findOneBy({ id: parseInt(evaluacionIntegradoraId) });
    
    if (!evaluacionIntegradora) return { error: "Evaluación integradora no encontrada" };
  } catch (err) {
    console.error("Error al obtener evaluación integradora:", err);
  }

  // Obtener pauta desde pautaId en params
  let pauta = null;
  if (pautaId) {
    pauta = await pautaRepository.findOneBy({ id: parseInt(pautaId) });
    if (!pauta) return { error: "Pauta no encontrada" };
  } else {
    return { error: "Se debe proporcionar una pauta para la evaluación integradora" };
  }

  // Obtener alumno a través de la relación con User (que tiene el rut)
  const alumno = await alumnoRepository
    .createQueryBuilder("a")
    .leftJoinAndSelect("a.user", "u")
    .where("u.rut = :rut", { rut: alumnoRut })
    .getOne();
    
  if (!alumno) return { error: "Alumno no encontrado" };

  const existing = await pautaEvaluadaIntegradoraRepository
    .createQueryBuilder("pei")
    .where("pei.evaluacionIntegradoraId = :evaluacionIntegradoraId", { evaluacionIntegradoraId })
    .andWhere("pei.alumnoRut = :alumnoRut", { alumnoRut })
    .getOne();
    
  if (existing) return { error: "Ya existe una pauta evaluada para este alumno en la evaluación integradora" };

  const distribucion = pauta.distribucionPuntaje || {};
  const puntajes = data.puntajes_obtenidos || {};

  const nota = calcNotaFinal(distribucion, puntajes);

  const pautaEval = pautaEvaluadaIntegradoraRepository.create({
    puntajesObtenidos: puntajes,
    notaFinal: nota,
    observaciones: data.observaciones || null,
    alumnoRut: alumnoRut,
    pautaId: parseInt(pautaId),
    evaluacionIntegradoraId: parseInt(evaluacionIntegradoraId),
    evaluacionIntegradora: { id: parseInt(evaluacionIntegradoraId) },
    pauta: { id: pauta.id },
    alumno: { rut: alumnoRut },
  });

  const saved = await pautaEvaluadaIntegradoraRepository.save(pautaEval);

  return saved;
}

export async function getPautaEvaluadaIntegradoraService(evaluacionIntegradoraId, alumnoRut) {
  const pauta = await pautaEvaluadaIntegradoraRepository
    .createQueryBuilder("pei")
    .leftJoinAndSelect("pei.evaluacionIntegradora", "ei")
    .leftJoinAndSelect("pei.pauta", "p")
    .where("pei.evaluacionIntegradoraId = :evaluacionIntegradoraId", { evaluacionIntegradoraId })
    .andWhere("pei.alumnoRut = :alumnoRut", { alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada integradora no encontrada" };
  return pauta;
}

export async function updatePautaEvaluadaIntegradoraService(evaluacionIntegradoraId, alumnoRut, data, user) {
  // Buscar la pautaEvaluada integradora por evaluacionIntegradoraId y alumnoRut
  const pauta = await pautaEvaluadaIntegradoraRepository
    .createQueryBuilder("pei")
    .leftJoinAndSelect("pei.pauta", "p")
    .where("pei.evaluacionIntegradoraId = :evaluacionIntegradoraId", { evaluacionIntegradoraId })
    .andWhere("pei.alumnoRut = :alumnoRut", { alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada integradora no encontrada" };

  // Actualizar puntajes si se proporcionan
  if (data.puntajes_obtenidos) {
    pauta.puntajesObtenidos = data.puntajes_obtenidos;
  }

  // Actualizar observaciones si se proporcionan
  if (data.observaciones !== undefined) {
    pauta.observaciones = data.observaciones;
  }

  // Recalcular la nota automáticamente basándose en los puntajes actuales
  const distribucion = pauta.pauta?.distribucionPuntaje || {};
  const puntajesActuales = pauta.puntajesObtenidos || {};
  const notaCalculada = calcNotaFinal(distribucion, puntajesActuales);
  pauta.notaFinal = notaCalculada;

  const saved = await pautaEvaluadaIntegradoraRepository.save(pauta);

  return saved;
}

export async function deletePautaEvaluadaIntegradoraService(evaluacionIntegradoraId, alumnoRut, user) {
  // Buscar la pautaEvaluada integradora por evaluacionIntegradoraId y alumnoRut
  const pauta = await pautaEvaluadaIntegradoraRepository
    .createQueryBuilder("pei")
    .where("pei.evaluacionIntegradoraId = :evaluacionIntegradoraId", { evaluacionIntegradoraId })
    .andWhere("pei.alumnoRut = :alumnoRut", { alumnoRut })
    .getOne();

  if (!pauta) return { error: "Pauta evaluada integradora no encontrada" };

  // No verificar permisos de creador para integradora (permitir eliminación por admin o profesor)
  if (user.role !== "admin" && user.role !== "profesor" && user.role !== "jefecarrera") {
    return { error: "No tienes permiso para eliminar esta pauta evaluada integradora" };
  }

  await pautaEvaluadaIntegradoraRepository.remove(pauta);

  return { message: "Pauta evaluada integradora eliminada exitosamente" };
}
