import { AppDataSource } from "../config/configDB.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { notificarAlumnos } from "./notificacionuno.service.js";
import { Ramos } from "../entities/ramos.entity.js";

const pautaRepository = AppDataSource.getRepository(Pauta);
const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
const evaluacionIntegradoraRepository = AppDataSource.getRepository(EvaluacionIntegradora);

export async function createPautaService(data, evaluacionId, evaluacionIntegradoraId) {
    console.log("createPautaService - evaluacionId:", evaluacionId, "evaluacionIntegradoraId:", evaluacionIntegradoraId);
    
    let pauta;
    
    if (evaluacionIntegradoraId) {
        // Para evaluación integradora, no validar estado (la integradora no tiene estado)
        pauta = pautaRepository.create({...data, evaluacionIntegradoraId});
    } else if (evaluacionId) {
        const evaluacion = await evaluacionRepository.findOneBy({id: evaluacionId});
        if (!evaluacion) return {error: "evaluacion no encontrada"};
        if(evaluacion.estado !== "pendiente"){
            return {error: "error al agregar una pauta a una evaluacion aplicada"};
        }
        pauta = pautaRepository.create({...data, evaluacionId});
    } else {
        return {error: "Debe enviar evaluacionId o evaluacionIntegradoraId"};
    }
    
    console.log("Estado de la pauta antes de guardar:", pauta.publicada);
    const savedPauta = await pautaRepository.save(pauta);
    console.log("Estado de la pauta después de guardar:", savedPauta.publicada);
    
    // Actualizar idPauta en la evaluación
    if (evaluacionId) {
        console.log("Actualizando evaluación", evaluacionId, "con idPauta:", savedPauta.id);
        const updateResult = await evaluacionRepository.update(evaluacionId, { idPauta: savedPauta.id });
        console.log("Resultado del update:", updateResult);
    }
    
    // Actualizar idPauta en la evaluacionIntegradora
    if (evaluacionIntegradoraId) {
        console.log("Actualizando evaluación integradora", evaluacionIntegradoraId, "con idPauta:", savedPauta.id);
        const updateResult = await evaluacionIntegradoraRepository.update(evaluacionIntegradoraId, { idPauta: savedPauta.id });
        console.log("Resultado del update en integradora:", updateResult);
    }
    
    return savedPauta;
}
export async function getPautaByIdService(id, user){
    const pauta = await pautaRepository.findOne({
        where: {id},
        relations:["evaluacion"],
    });
    if (!pauta) return {error : "pauta no encontrada"};

    if(user.role === "estudiante" && !pauta.publicada){
        return {error : "la puata no ha sido publicada"};
    }
    return pauta;
}

export async function updatePautaService(id, data, user) {
  const pauta = await pautaRepository.findOne({
    where: { id },
    relations: ["evaluacion"],
  });

  if (!pauta) return { error: "Pauta no encontrada" };
  if (user.role !== "profesor" && user.role !== "jefecarrera") return { error: "No autorizado" };

  // Actualizar los campos que vienen en data
  pauta.criterios = data.criterios || pauta.criterios;
  pauta.distribucionPuntaje = data.distribucionPuntaje || pauta.distribucionPuntaje;
  pauta.publicada = data.publicada !== undefined ? data.publicada : pauta.publicada;
  
  const updatedPauta = await pautaRepository.save(pauta);
  console.log("Pauta actualizada:", updatedPauta);

  
  try {
    const evaluacion = await evaluacionRepository.findOne({ where: { id: pauta.evaluacion.id }, relations: ["ramo"] });
    const ramoId = evaluacion?.ramo?.id;

    if (ramoId) {
      const ramoRepo = AppDataSource.getRepository(Ramos);
      const ramo = await ramoRepo.findOne({
        where: { id: ramoId },
        relations: ["secciones", "secciones.alumnos", "secciones.alumnos.user"],
      });

      const emails = [];
      if (ramo && ramo.secciones && ramo.secciones.length > 0) {
        ramo.secciones.forEach((seccion) => {
          if (seccion.alumnos && seccion.alumnos.length > 0) {
            seccion.alumnos.forEach((alumno) => {
              if (alumno.user && alumno.user.email) emails.push(alumno.user.email);
            });
          }
        });
      }


      const uniqueEmails = [...new Set(emails)];

      const created = await notificarAlumnos(
        uniqueEmails,
        "Nueva pauta publicada",
        `Se ha publicado la pauta para ${evaluacion.titulo}`,
        evaluacion.id
      );

      console.log(`Notificaciones creadas: ${created.count || 0} alumnos notificados para ramo ${ramoId}`);
    }
  } catch (err) {
    console.warn("Advertencia: no se pudieron notificar alumnos tras publicar la pauta:", err.message || err);
  }

  return updatedPauta;
}

export async function deletePautaService(id, user) {
  const pauta = await pautaRepository.findOne({
    where: {id},
    relations: ["evaluacion"],
  });

  if (!pauta) return { error: "Pauta no encontrada" };
  if (user.role !== "profesor") return { error: "Solo el profesores puede eliminar la pauta" };
  if (pauta.evaluacion.estado !== "pendiente") {
    return { error: "No puede eliminar una pauta de evaluación aplicada" };
  }

  await pautaRepository.remove(pauta);
  return { success: true };
}
export async function getAllPautasService(user) {
  // Obtener todas las pautas; si es alumno, devolver solo las publicadas
  const pautas = await pautaRepository.find({ relations: ["evaluacion"] });
  if (user && user.role === "alumno") {
    return pautas.filter(p => p.publicada === true);
  }
  return pautas;
}

export async function getPautaIntegradoraService(evaluacionIntegradoraId, user) {
  try {
    const pauta = await pautaRepository.findOne({
      where: { evaluacionIntegradoraId },
      relations: ["evaluacion"],
    });
    if (!pauta) return {error: "pauta integradora no encontrada"};

    if(user?.role === "estudiante" && !pauta.publicada){
      return {error: "la pauta no ha sido publicada"};
    }
    return pauta;
  } catch (error) {
    console.error("Error en getPautaIntegradoraService:", error);
    return {error: error.message || "Error al obtener pauta integradora"};
  }
}

export async function updatePautaIntegradoraService(evaluacionIntegradoraId, data, user) {
  const pauta = await pautaRepository.findOne({
    where: { evaluacionIntegradoraId },
    relations: ["evaluacion"],
  });

  if (!pauta) return { error: "Pauta integradora no encontrada" };
  if (user.role !== "profesor" && user.role !== "jefecarrera") return { error: "No autorizado" };

  // Actualizar los campos que vienen en data
  pauta.criterios = data.criterios || pauta.criterios;
  pauta.distribucionPuntaje = data.distribucionPuntaje || pauta.distribucionPuntaje;
  pauta.publicada = data.publicada !== undefined ? data.publicada : pauta.publicada;
  
  const updatedPauta = await pautaRepository.save(pauta);
  console.log("Pauta integradora actualizada:", updatedPauta);

  return updatedPauta;
}

export async function deletePautaIntegradoraService(evaluacionIntegradoraId, user) {
  const pauta = await pautaRepository.findOne({
    where: { evaluacionIntegradoraId },
  });

  if (!pauta) return { error: "Pauta integradora no encontrada" };
  if (user.role !== "profesor" && user.role !== "jefecarrera") return { error: "No autorizado" };

  // Eliminar pautas evaluadas relacionadas a la pauta
  const pautaEvaluadaRepository = AppDataSource.getRepository(require("../entities/pautaEvaluada.entity.js").PautaEvaluada);
  await pautaEvaluadaRepository.delete({ pauta: { id: pauta.id } });

  // Eliminar la pauta relacionada a la evaluación integradora
  await pautaRepository.remove(pauta);
  console.log("Pauta integradora eliminada:", pauta.id);

  return { success: true, message: "Pauta integradora y pautas evaluadas relacionadas eliminadas" };
}

/**
 * Obtener pauta por evaluación
 */
export async function getPautaByEvaluacionService(evaluacionId) {
  try {
    const pauta = await pautaRepository.findOne({
      where: { evaluacionId },
    });
    return pauta;
  } catch (error) {
    console.error("Error al obtener pauta por evaluación:", error);
    return null;
  }
}

/**
 * Obtener pauta por evaluación integradora
 */
export async function getPautaByEvaluacionIntegradoraService(evaluacionIntegradoraId) {
  try {
    const pauta = await pautaRepository.findOne({
      where: { evaluacionIntegradoraId },
    });
    return pauta;
  } catch (error) {
    console.error("Error al obtener pauta por evaluación integradora:", error);
    return null;
  }
}