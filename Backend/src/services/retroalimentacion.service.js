import { AppDataSource } from "../config/configDB.js";
import { Retroalimentacion } from "../entities/retroalimentacion.entity.js";
import { User } from "../entities/user.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";

const retroalimentacionRepo = AppDataSource.getRepository(Retroalimentacion);
const userRepo = AppDataSource.getRepository(User);
const ramoRepo = AppDataSource.getRepository(Ramos);
const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
const evaluacionIntegradoraRepo = AppDataSource.getRepository(EvaluacionIntegradora);
const alumnoRepo = AppDataSource.getRepository(Alumno);
const pautaEvaluadaRepo = AppDataSource.getRepository(PautaEvaluada);

/**
 * Crear mensaje de retroalimentación
 */
export async function crearMensajeRetroalimentacion(data) {
  try {
    const {
      evaluacionId,
      evaluacionIntegradoraId,
      profesorId,
      alumnoRut,
      ramoId,
      codigoRamo,
      mensaje,
      creadoPor,
      rutEmisor,
      rutReceptor,
    } = data;

    // Validar que el usuario sea profesor, jefe de carrera o alumno
    const usuario = await userRepo.findOne({
      where: { rut: rutEmisor },
    });

    if (!usuario || (usuario.role !== "profesor" && usuario.role !== "jefecarrera" && usuario.role !== "alumno")) {
      return { error: "Usuario no autorizado para enviar mensajes" };
    }

    // Validar que el alumno exista
    const alumno = await alumnoRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "u")
      .where("u.rut = :rut", { rut: alumnoRut })
      .getOne();

    if (!alumno) {
      return { error: "Alumno no encontrado" };
    }

    const retroalimentacion = retroalimentacionRepo.create({
      evaluacionId: evaluacionId || null,
      evaluacionIntegradoraId: evaluacionIntegradoraId || null,
      profesorId,
      alumnoRut,
      ramoId,
      codigoRamo,
      mensaje,
      creadoPor,
      rutEmisor,
      rutReceptor,
      visto: false,
    });

    const guardada = await retroalimentacionRepo.save(retroalimentacion);
    return { success: true, data: guardada };
  } catch (error) {
    console.error("Error al crear mensaje de retroalimentación:", error);
    return { error: error.message };
  }
}

/**
 * Obtener mensajes de retroalimentación de una evaluación
 */
export async function obtenerMensajesRetroalimentacion(evaluacionId, evaluacionIntegradoraId, userId, alumnoRut, profesorRut) {
  try {
    // Filtrar por ambos RUTs para obtener solo el chat entre estos dos usuarios
    const whereConditions = {
      alumnoRut,
    };

    // Filtrar por los RUTs del emisor y receptor
    if (alumnoRut && profesorRut) {
      // Obtener mensajes donde (emisor = alumno Y receptor = profesor) O (emisor = profesor Y receptor = alumno)
      const mensajes = await retroalimentacionRepo
        .createQueryBuilder("r")
        .where(
          "(r.rutEmisor = :alumnoRut AND r.rutReceptor = :profesorRut) OR (r.rutEmisor = :profesorRut AND r.rutReceptor = :alumnoRut)",
          { alumnoRut, profesorRut }
        )
        .andWhere(
          evaluacionId ? "r.evaluacionId = :evaluacionId" : "r.evaluacionIntegradoraId = :evaluacionIntegradoraId",
          { 
            evaluacionId: evaluacionId || null, 
            evaluacionIntegradoraId: evaluacionIntegradoraId || null 
          }
        )
        .leftJoinAndSelect("r.profesor", "p")
        .leftJoinAndSelect("r.ramo", "rm")
        .orderBy("r.createdAt", "ASC")
        .getMany();

      return { success: true, data: mensajes };
    }

    // Fallback: obtener por alumnoRut si no hay profesorRut
    const mensajes = await retroalimentacionRepo.find({
      where: whereConditions,
      relations: ["profesor", "ramo"],
      order: { createdAt: "ASC" },
    });

    return { success: true, data: mensajes };
  } catch (error) {
    console.error("Error al obtener mensajes de retroalimentación:", error);
    return { error: error.message };
  }
}

/**
 * Marcar mensajes como vistos
 */
export async function marcarMensajesComoVistos(evaluacionId, evaluacionIntegradoraId, userId, alumnoRut) {
  try {
    const whereConditions = {
      alumnoRut,
      visto: false,
    };

    if (evaluacionId) {
      whereConditions.evaluacionId = evaluacionId;
    } else if (evaluacionIntegradoraId) {
      whereConditions.evaluacionIntegradoraId = evaluacionIntegradoraId;
    }

    await retroalimentacionRepo.update(whereConditions, { visto: true });

    return { success: true };
  } catch (error) {
    console.error("Error al marcar mensajes como vistos:", error);
    return { error: error.message };
  }
}

/**
 * Obtener conversaciones del profesor con sus alumnos
 */
export async function obtenerConversacionesProfesor(profesorId, ramoId) {
  try {
    const conversaciones = await retroalimentacionRepo
      .createQueryBuilder("r")
      .select("r.alumnoRut", "alumnoRut")
      .addSelect("r.evaluacionId", "evaluacionId")
      .addSelect("r.evaluacionIntegradoraId", "evaluacionIntegradoraId")
      .addSelect("COUNT(r.id)", "totalMensajes")
      .addSelect("SUM(CASE WHEN r.visto = false THEN 1 ELSE 0 END)", "noVistos")
      .addSelect("MAX(r.created_at)", "ultimoMensaje")
      .where("r.profesorId = :profesorId", { profesorId })
      .andWhere("r.ramoId = :ramoId", { ramoId })
      .groupBy("r.alumnoRut")
      .addGroupBy("r.evaluacionId")
      .addGroupBy("r.evaluacionIntegradoraId")
      .orderBy("MAX(r.created_at)", "DESC")
      .getRawMany();

    return { success: true, data: conversaciones };
  } catch (error) {
    console.error("Error al obtener conversaciones del profesor:", error);
    return { error: error.message };
  }
}

/**
 * Obtener mensajes no vistos del alumno
 */
export async function obtenerMensajesNoVistosAlumno(alumnoRut, ramoId) {
  try {
    const mensajes = await retroalimentacionRepo.find({
      where: {
        alumnoRut,
        ramoId,
        visto: false,
      },
      relations: ["profesor", "ramo"],
      order: { createdAt: "DESC" },
    });

    return { success: true, data: mensajes };
  } catch (error) {
    console.error("Error al obtener mensajes no vistos:", error);
    return { error: error.message };
  }
}

// Compatibilidad con código anterior
export async function addRetroalimentacionService(pautaId, data, user) {
  try {
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