import { AppDataSource } from "../config/configDb.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Alumno } from "../entities/alumno.entity.js";

const pautaEvaluadaRepository = AppDataSource.getRepository(PautaEvaluada);
const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
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

function calcNotaFinal(distribucionPuntaje, puntajesObtenidos) {s
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

export async function createPautaEvaluadaService(evaluacionId, data, user) {
  const evaluacion = await evaluacionRepository.findOne({
    where: { id: evaluacionId },
    relations: ["pauta"],
  });
  if (!evaluacion) return { error: "Evaluación no encontrada" };

  if (!evaluacion.pauta) return { error: "La evaluación no tiene una pauta definida" };

  const alumno = await alumnoRepository.findOneBy({ id: data.alumno_id });
  if (!alumno) return { error: "Alumno no encontrado" };


  const existing = await pautaEvaluadaRepository.findOne({
    where: {
      evaluacion: { id: evaluacionId },
      alumno: { id: data.alumno_id },
    },
  });
  if (existing) return { error: "Ya existe una pauta evaluada para este alumno en la evaluación" };

  const distribucion = evaluacion.pauta.distribucionPuntaje || {};
  const puntajes = data.puntajes_obtenidos || {};

  const nota = calcNotaFinal(distribucion, puntajes);

  const pautaEval = pautaEvaluadaRepository.create({
    puntajesObtenidos: puntajes,
    notaFinal: nota,
    observaciones: data.observaciones || null,
    retroalimentacion: [],
    creadaPor: user?.id || null,
    evaluacion: { id: evaluacionId },
    alumno: { id: data.alumno_id },
  });

  const saved = await pautaEvaluadaRepository.save(pautaEval);
  await updateEvaluacionPromedio(evaluacionId);

  return saved;
}

export async function getPautaEvaluadaService(id) {
  const pauta = await pautaEvaluadaRepository.findOne({
    where: { id },
    relations: ["evaluacion", "alumno"],
  });
  if (!pauta) return { error: "Pauta evaluada no encontrada" };
  return pauta;
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

export async function updatePautaEvaluadaService(id, data, user) {
  const pauta = await pautaEvaluadaRepository.findOne({ where: { id }, relations: ['evaluacion'] });
  if (!pauta) return { error: 'Pauta evaluada no encontrada' };

  if (user.role !== 'admin' && pauta.creadaPor !== user.id) {
    return { error: 'No tienes permiso para modificar esta pauta evaluada' };
  }

  if (data.puntajes_obtenidos) {
    const evaluacion = await evaluacionRepository.findOne({ where: { id: pauta.evaluacion.id }, relations: ['pauta'] });
    const distribucion = evaluacion.pauta?.distribucionPuntaje || {};
    const nota = calcNotaFinal(distribucion, data.puntajes_obtenidos);
    pauta.puntajesObtenidos = data.puntajes_obtenidos;
    pauta.notaFinal = nota;
  }

  if (data.observaciones !== undefined) pauta.observaciones = data.observaciones;

  const saved = await pautaEvaluadaRepository.save(pauta);

  await updateEvaluacionPromedio(pauta.evaluacion.id);

  return saved;
}

export async function deletePautaEvaluadaService(id, user) {
  const pauta = await pautaEvaluadaRepository.findOne({ where: { id }, relations: ['evaluacion'] });
  if (!pauta) return { error: 'Pauta evaluada no encontrada' };


  if (user.role !== 'admin' && pauta.creadaPor !== user.id) {
    return { error: 'No tienes permiso para eliminar esta pauta evaluada' };
  }

  const evaluacionId = pauta.evaluacion.id;
  await pautaEvaluadaRepository.remove(pauta);

  await updateEvaluacionPromedio(evaluacionId);

  return { message: 'Pauta evaluada eliminada' };
}
