import { AppDataSource } from "../config/database.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";

export async function addRetroalimentacionService(pautaId, data, user) {
  try {
    const pautaEvaluadaRepo = AppDataSource.getRepository(PautaEvaluada);
    const pautaEvaluada = await pautaEvaluadaRepo.findOne({
      where: { id: pautaId },
      relations: ["evaluacion", "alumno"]
    });

    if (!pautaEvaluada) {
      return { error: "Pauta evaluada no encontrada" };
    }

    if (user.role === "profesor" && pautaEvaluada.evaluacion.profesor_id !== user.id) {
      return { error: "No tiene permisos para agregar retroalimentación a esta pauta" };
    }
    if (user.role === "alumno" && pautaEvaluada.alumno.id !== user.id) {
      return { error: "No tiene permisos para responder a esta retroalimentación" };
    }

    const nuevoComentario = {
      id: Date.now(),
      autor: user.id,
      rol: user.role,
      contenido: data.contenido,
      timestamp: new Date(),
      tipo: data.tipo
    };

    const retroalimentaciones = pautaEvaluada.retroalimentacion || [];
    retroalimentaciones.push(nuevoComentario);

    if (user.role === "profesor") {
      if (data.tipo === "observacion") {
        pautaEvaluada.observaciones = data.contenido;
      } else if (data.tipo === "sugerencia") {
        pautaEvaluada.sugerenciasMejora = data.contenido;
      }
    }

    pautaEvaluada.retroalimentacion = retroalimentaciones;
    await pautaEvaluadaRepo.save(pautaEvaluada);

    return { success: true, retroalimentacion: nuevoComentario };
  } catch (error) {
    console.error("Error en addRetroalimentacionService:", error);
    return { error: "Error al agregar retroalimentación" };
  }
}

export async function getRetroalimentacionesService(pautaId, user) {
  try {
    const pautaEvaluadaRepo = AppDataSource.getRepository(PautaEvaluada);
    const pautaEvaluada = await pautaEvaluadaRepo.findOne({
      where: { id: pautaId },
      relations: ["evaluacion", "alumno"]
    });

    if (!pautaEvaluada) {
      return { error: "Pauta evaluada no encontrada" };
    }

    if (user.role === "alumno" && pautaEvaluada.alumno.id !== user.id) {
      return { error: "No tiene permisos para ver esta retroalimentación" };
    }
    if (user.role === "profesor" && pautaEvaluada.evaluacion.profesor_id !== user.id) {
      return { error: "No tiene permisos para ver esta retroalimentación" };
    }

    return {
      retroalimentaciones: pautaEvaluada.retroalimentacion || [],
      observaciones: pautaEvaluada.observaciones,
      sugerenciasMejora: pautaEvaluada.sugerenciasMejora
    };
  } catch (error) {
    console.error("Error en getRetroalimentacionesService:", error);
    return { error: "Error al obtener retroalimentaciones" };
  }
}
