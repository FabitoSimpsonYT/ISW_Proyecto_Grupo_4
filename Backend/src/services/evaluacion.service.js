import { AppDataSource } from "../config/configDb.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { BadRequestError } from "../Handlers/responseHandlers.js";

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
  const evaluacion = await evaluacionRepository.findOneBy({ id });

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
  const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, ramo_id, codigoRamo } = data;
  // Resolve ramo_id from codigoRamo if not provided
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
  
  // Parse horaInicio and horaFin to extract hours and minutes (format: "HH:mm")
  const [newHoraInicioHH, newHoraInicioMM] = horaInicio.split(':').map(Number);
  const [newHoraFinHH, newHoraFinMM] = horaFin.split(':').map(Number);
  const newHoraInicioTotal = newHoraInicioHH * 60 + newHoraInicioMM; // Convert to minutes
  const newHoraFinTotal = newHoraFinHH * 60 + newHoraFinMM; // Convert to minutes

  // Format fechaProgramada as string (YYYY-MM-DD) for comparison
  let fechaStr;
  if (fechaProgramada instanceof Date) {
    fechaStr = fechaProgramada.toISOString().split('T')[0];
  } else if (typeof fechaProgramada === 'string') {
    // Si es string, asegurarse que es YYYY-MM-DD
    fechaStr = fechaProgramada.includes('T') ? fechaProgramada.split('T')[0] : fechaProgramada;
  } else {
    fechaStr = String(fechaProgramada);
  }

  

  // Consultar en la base de datos las evaluaciones que tienen la misma fechaProgramada
  // Normalizamos la fecha a 'YYYY-MM-DD' y la usamos en la consulta para evitar comparaciones en memoria
  const fechaQuery = fechaStr; // 'YYYY-MM-DD'
  const evaluacionesMismaFecha = await evaluacionRepository.find({ where: { fechaProgramada: fechaQuery } });
  
  // Si hay evaluaciones en la misma fecha, verificar solapamiento de horas
  if (evaluacionesMismaFecha.length > 0) {
    for (const evaluacion of evaluacionesMismaFecha) {
      if (evaluacion.horaInicio && evaluacion.horaFin) {
        const [evalHoraInicioHH, evalHoraInicioMM] = evaluacion.horaInicio.split(':').map(Number);
        const [evalHoraFinHH, evalHoraFinMM] = evaluacion.horaFin.split(':').map(Number);
        const evalHoraInicioTotal = evalHoraInicioHH * 60 + evalHoraInicioMM;
        const evalHoraFinTotal = evalHoraFinHH * 60 + evalHoraFinMM;

       

        // Verificar si hay solapamiento: 
        // Dos rangos se solapan si: inicio1 < fin2 AND fin1 > inicio2
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