import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { BadRequestError } from "../Handlers/responseHandlers.js";

const evaluacionRepository = AppDataSource.getRepository(Evaluacion); 

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


  const evaluacionConRelaciones = await evaluacionRepository.findOne({ where: { id }, relations: ["ramo"] });
  return evaluacionConRelaciones;
}

export async function getEvaluacionesByCodigoRamoService(codigoRamo, user) {
  const ramosRepository = AppDataSource.getRepository(Ramos);
  const ramo = await ramosRepository.findOne({ where: { codigo: codigoRamo } });

  if (!ramo) return null;

  const whereClause = isAlumnoRole(user.role)
    ? { ramo: { id: ramo.id }, pautaPublicada: true }
    : { ramo: { id: ramo.id } };

  const evaluaciones = await evaluacionRepository.find({
    where: whereClause,
    relations: isAlumnoRole(user.role) ? [] : ["ramo"],
    order: { fechaProgramada: "DESC" },
  });

  if (isAlumnoRole(user.role)) {
    return evaluaciones.map((evaluacion) => ({
      titulo: evaluacion.titulo,
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

  Object.assign(evaluacion, data);
  return await evaluacionRepository.save(evaluacion);
}

export async function deleteEvaluacionService(id) {
  const evaluacion = await evaluacionRepository.findOneBy({ id });

  if (!evaluacion) return null;

  await evaluacionRepository.remove(evaluacion);
  return true;
}