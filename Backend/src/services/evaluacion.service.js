import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Pauta } from "../entities/pauta.entity.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { BadRequestError } from "../Handlers/responseHandlers.js";

const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
const pautaRepository = AppDataSource.getRepository(Pauta);
const pautaEvaluadaRepository = AppDataSource.getRepository(PautaEvaluada); 

function isAlumnoRole(role) {
  return role === "alumno" || role === "estudiante";
}

export async function getAllEvaluacionesService(user) {
  if (user.role === "profesor") {
    return await evaluacionRepository.find();
  }

  if (isAlumnoRole(user.role)) {
    return await evaluacionRepository.find({
      where: { pautaPublicada: true },
      select: [
        "titulo",
        "fechaProgramada",
        "horaInicio",
        "horaFin",
        "ponderacion",
        "estado",
        "aplicada",
        "pautaPublicada",
      ],
      order: { fechaProgramada: "DESC" },
    });
  }

  return await evaluacionRepository.find({
    select: [
      "titulo",
      "fechaProgramada",
      "horaInicio",
      "horaFin",
      "ponderacion",
      "estado",
      "aplicada",
      "pautaPublicada",
    ],
    order: { fechaProgramada: "DESC" },
  });
}

export async function getEvaluacionByIdService(id, user){

  if (isAlumnoRole(user.role)) {
    const evaluacion = await evaluacionRepository.findOneBy({ id });
    if (!evaluacion) return null;
    if (!evaluacion.pautaPublicada) return null;
    return {
      titulo: evaluacion.titulo,
      fechaProgramada: evaluacion.fechaProgramada,
      horaInicio: evaluacion.horaInicio,
      horaFin: evaluacion.horaFin,
      ponderacion: evaluacion.ponderacion,
      aplicada: evaluacion.aplicada,
      estado: evaluacion.estado,
      pautaPublicada: evaluacion.pautaPublicada,
    };
  }


  const evaluacionConRelaciones = await evaluacionRepository.findOne({ where: { id }, relations: ["ramo", "pauta"] });
  return evaluacionConRelaciones;
}

export async function getEvaluacionesByCodigoRamoService(codigoRamo, user) {
  console.log("getEvaluacionesByCodigoRamoService - buscando evaluaciones con codigoRamo:", codigoRamo);
  
  const whereClause = { codigoRamo: codigoRamo };

  console.log("Búscando evaluaciones con whereClause:", whereClause);

  const evaluaciones = await evaluacionRepository.find({
    where: whereClause,
    relations: ["ramo", "pauta"],
    order: { fechaProgramada: "DESC" },
  });

  console.log("Evaluaciones encontradas:", JSON.stringify(evaluaciones, null, 2));

  if (isAlumnoRole(user.role)) {
    return evaluaciones.map((evaluacion) => ({
      id: evaluacion.id,
      titulo: evaluacion.titulo,
      nombre: evaluacion.titulo,
      fechaProgramada: evaluacion.fechaProgramada,
      horaInicio: evaluacion.horaInicio,
      horaFin: evaluacion.horaFin,
      ponderacion: evaluacion.ponderacion,
      aplicada: evaluacion.aplicada,
      estado: evaluacion.estado,
      pautaPublicada: evaluacion.pautaPublicada,
    }));
  }

  return evaluaciones;
}


export async function createEvaluacionService(data) {
  const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, ramo_id, codigoRamo, puntajeTotal, pautaPublicada } = data;
  let resolvedRamoId = ramo_id;
  if (!resolvedRamoId && codigoRamo) {
    const ramosRepository = AppDataSource.getRepository(Ramos);
    const ramo = await ramosRepository.findOne({ where: { codigo: codigoRamo } });
    if (!ramo) {
      throw new BadRequestError(`No se encontró ramo con código: ${codigoRamo}`);
    }
    resolvedRamoId = ramo.id;
  }
  if (!resolvedRamoId) {
    throw new BadRequestError('Se requiere ramo_id o codigoRamo para crear la evaluación');
  }
  

  const [newHoraInicioHH, newHoraInicioMM] = horaInicio.split(':').map(Number);
  const [newHoraFinHH, newHoraFinMM] = horaFin.split(':').map(Number);
  const newHoraInicioTotal = newHoraInicioHH * 60 + newHoraInicioMM; 
  const newHoraFinTotal = newHoraFinHH * 60 + newHoraFinMM; 

  
  let fechaStr;
  if (fechaProgramada instanceof Date) {
    fechaStr = fechaProgramada.toISOString().split('T')[0];
  } else if (typeof fechaProgramada === 'string') {
    fechaStr = fechaProgramada.includes('T') ? fechaProgramada.split('T')[0] : fechaProgramada;
  } else {
    fechaStr = String(fechaProgramada);
  }

  


  const fechaQuery = fechaStr;
  const evaluacionesMismaFecha = await evaluacionRepository.find({ where: { fechaProgramada: fechaQuery } });
  
  // Si hay evaluaciones en la misma fecha, verificar solapamiento de horas
  if (evaluacionesMismaFecha.length > 0) {
    for (const evaluacion of evaluacionesMismaFecha) {
      if (evaluacion.horaInicio && evaluacion.horaFin) {
        const [evalHoraInicioHH, evalHoraInicioMM] = evaluacion.horaInicio.split(':').map(Number);
        const [evalHoraFinHH, evalHoraFinMM] = evaluacion.horaFin.split(':').map(Number);
        const evalHoraInicioTotal = evalHoraInicioHH * 60 + evalHoraInicioMM;
        const evalHoraFinTotal = evalHoraFinHH * 60 + evalHoraFinMM;

       

        const haysolapamiento = newHoraInicioTotal < evalHoraFinTotal && newHoraFinTotal > evalHoraInicioTotal;

        if (haysolapamiento) {
          throw new BadRequestError(
            `Existe un solapamiento de horarios en la fecha ${fechaStr}. ` +
            `Ya hay una evaluación programada de ${evaluacion.horaInicio} a ${evaluacion.horaFin}. ` +
            `No se puede crear evaluación de ${horaInicio} a ${horaFin}.`
          );
        }
      }
    }
  }

  

  const nueva = evaluacionRepository.create({
    titulo,
    fechaProgramada: fechaStr,
    horaInicio,
    horaFin,
    ponderacion,
    contenidos,
    puntajeTotal: puntajeTotal || 0,
    pautaPublicada: Boolean(pautaPublicada),
    codigoRamo: codigoRamo || null,
    ramo: { id: resolvedRamoId }
  });
  const saved = await evaluacionRepository.save(nueva);
  
  // Recargar la evaluación con la relación ramo completa
  const evaluacionCompleta = await evaluacionRepository.findOne({
    where: { id: saved.id },
    relations: ["ramo"]
  });
  
  return evaluacionCompleta;
}

export async function updateEvaluacionService(id, data) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  // Procesar los campos que se actualizan
  if (data.titulo !== undefined) evaluacion.titulo = data.titulo;
  if (data.fechaProgramada !== undefined) evaluacion.fechaProgramada = data.fechaProgramada;
  if (data.horaInicio !== undefined) evaluacion.horaInicio = data.horaInicio;
  if (data.horaFin !== undefined) evaluacion.horaFin = data.horaFin;
  if (data.ponderacion !== undefined) evaluacion.ponderacion = data.ponderacion;
  if (data.contenidos !== undefined) evaluacion.contenidos = data.contenidos;
  if (data.estado !== undefined) evaluacion.estado = data.estado;
  if (data.puntajeTotal !== undefined) evaluacion.puntajeTotal = data.puntajeTotal;
  if (data.pautaPublicada !== undefined) evaluacion.pautaPublicada = data.pautaPublicada;
  if (data.aplicada !== undefined) evaluacion.aplicada = data.aplicada;
  
  // Procesar pauta correctamente
  if (data.pauta !== undefined) {
    if (data.pauta === null || data.pauta === '') {
      evaluacion.pauta = null;
    } else if (typeof data.pauta === 'object') {
      // Si es objeto, extraer el id
      if (data.pauta && data.pauta.id !== null && data.pauta.id !== undefined) {
        evaluacion.pauta = Number(data.pauta.id);
      } else {
        evaluacion.pauta = null;
      }
    } else if (typeof data.pauta === 'string') {
      // Si es string, convertir a número si no es vacío
      const pautaNum = Number(data.pauta);
      evaluacion.pauta = Number.isFinite(pautaNum) ? pautaNum : null;
    } else if (typeof data.pauta === 'number') {
      evaluacion.pauta = data.pauta;
    } else {
      evaluacion.pauta = null;
    }
  }

  const updated = await evaluacionRepository.save(evaluacion);
  
  // Recargar con relaciones
  const evaluacionCompleta = await evaluacionRepository.findOne({
    where: { id: updated.id },
    relations: ["ramo"]
  });
  
  return evaluacionCompleta;
}

export async function deleteEvaluacionService(id) {
  try {
    const evaluacion = await evaluacionRepository.findOneBy({ id });

    if (!evaluacion) return null;

    // 1. Buscar y eliminar todas las pautas evaluadas asociadas a la evaluación
    console.log("Buscando pautas evaluadas para evaluación:", id);
    const pautasEvaluadas = await pautaEvaluadaRepository.find({
      where: { evaluacionId: id },
    });
    
    if (pautasEvaluadas && pautasEvaluadas.length > 0) {
      console.log("Eliminando", pautasEvaluadas.length, "pautas evaluadas");
      await pautaEvaluadaRepository.remove(pautasEvaluadas);
    }

    // 2. Buscar y eliminar la pauta asociada a la evaluación
    if (evaluacion.idPauta) {
      console.log("Buscando pauta asociada a evaluación:", evaluacion.idPauta);
      const pauta = await pautaRepository.findOneBy({ id: evaluacion.idPauta });
      
      if (pauta) {
        console.log("Eliminando pauta con ID:", pauta.id);
        await pautaRepository.remove(pauta);
      }
    }

    // 3. Eliminar la evaluación
    console.log("Eliminando evaluación con ID:", id);
    await evaluacionRepository.remove(evaluacion);
    
    return true;
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    throw error;
  }
}