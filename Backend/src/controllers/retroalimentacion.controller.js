import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { 
  addRetroalimentacionService, 
  getRetroalimentacionesService,
  crearMensajeRetroalimentacion,
  obtenerMensajesRetroalimentacion,
  marcarMensajesComoVistos,
  obtenerConversacionesProfesor,
  obtenerMensajesNoVistosAlumno,
} from "../services/retroalimentacion.service.js";
import { validateRetroalimentacion } from "../validations/retroalimentacion.validation.js";
import { AppDataSource } from "../config/configDB.js";

// ========== ENDPOINTS ANTIGUOS (compatibilidad) ==========

export async function addRetroalimentacion(req, res) {
  try {
    const { error } = validateRetroalimentacion.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { pautaId } = req.params;
    const user = req.user;

    const result = await addRetroalimentacionService(pautaId, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Retroalimentación agregada exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, "Error al agregar retroalimentación", error.message);
  }
}

export async function getRetroalimentaciones(req, res) {
  try {
    const { pautaId } = req.params;
    const user = req.user;

    const result = await getRetroalimentacionesService(pautaId, user);
    if (result.error) return handleErrorClient(res, 404, result.error);

    handleSuccess(res, 200, "Retroalimentaciones obtenidas exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener retroalimentaciones", error.message);
  }
}

// ========== NUEVOS ENDPOINTS PARA MENSAJERÍA CON WEBSOCKET ==========

/**
 * POST /retroalimentacion/mensaje
 * Crear mensaje de retroalimentación
 */
export async function crearRetroalimentacionMensaje(req, res) {
  try {
    const { evaluacionId, evaluacionIntegradoraId, alumnoRut, ramoId, codigoRamo, mensaje } = req.body;
    const user = req.user;

    // Validar que sea profesor o jefe de carrera
    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(res, 403, "Solo profesores pueden enviar retroalimentaciones");
    }

    // Validar campos obligatorios
    if (!mensaje || !alumnoRut || !ramoId) {
      return handleErrorClient(res, 400, "Faltan campos obligatorios");
    }

    if (!evaluacionId && !evaluacionIntegradoraId) {
      return handleErrorClient(res, 400, "Debe proporcionar evaluacionId o evaluacionIntegradoraId");
    }

    const resultado = await crearMensajeRetroalimentacion({
      evaluacionId: evaluacionId || null,
      evaluacionIntegradoraId: evaluacionIntegradoraId || null,
      profesorId: user.id,
      alumnoRut,
      ramoId,
      codigoRamo: codigoRamo || null,
      mensaje,
      creadoPor: user.id,
    });

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Mensaje de retroalimentación enviado", { retroalimentacion: resultado.data });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear retroalimentación", error.message);
  }
}

/**
 * GET /retroalimentacion/mensajes/:alumnoRut/:ramoId
 * Obtener mensajes de retroalimentación
 */
export async function obtenerRetroalimentacionMensajes(req, res) {
  try {
    const { alumnoRut, ramoId } = req.params;
    const { evaluacionId, evaluacionIntegradoraId } = req.query;
    const user = req.user;

    // Solo pueden obtener sus propios mensajes los alumnos
    if (user.role === "alumno" && user.rut !== alumnoRut) {
      return handleErrorClient(res, 403, "No tiene permiso para ver estos mensajes");
    }

    // Determinar el profesorRut según el rol
    let profesorRut = null;
    if (user.role === "profesor" || user.role === "jefecarrera") {
      // Si es profesor, su propio RUT
      profesorRut = user.rut;
    } else if (user.role === "alumno") {
      // Si es alumno, obtener el RUT del profesor del ramo
      const { Ramos } = await import("../entities/ramos.entity.js");
      const { User } = await import("../entities/user.entity.js");
      const ramoRepo = AppDataSource.getRepository(Ramos);
      const userRepo = AppDataSource.getRepository(User);

      const ramo = await ramoRepo
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.profesor", "p")
        .where("r.codigo = :codigo", { codigo: ramoId })
        .orWhere("r.id = :id", { id: parseInt(ramoId, 10) })
        .getOne();

      if (ramo && ramo.profesor) {
        profesorRut = ramo.profesor.rut;
      }
    }

    const resultado = await obtenerMensajesRetroalimentacion(
      evaluacionId ? parseInt(evaluacionId) : null,
      evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null,
      user.id,
      alumnoRut,
      profesorRut
    );

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Mensajes obtenidos", { mensajes: resultado.data });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener retroalimentación", error.message);
  }
}

/**
 * PATCH /retroalimentacion/mensajes/:alumnoRut/:ramoId/marcar-vistos
 * Marcar mensajes como vistos
 */
export async function marcarRetroalimentacionVistos(req, res) {
  try {
    const { alumnoRut, ramoId } = req.params;
    const { evaluacionId, evaluacionIntegradoraId } = req.body;
    const user = req.user;

    // Solo pueden marcar sus propios mensajes como vistos los alumnos
    if (user.role === "alumno" && user.rut !== alumnoRut) {
      return handleErrorClient(res, 403, "No tiene permiso");
    }

    const resultado = await marcarMensajesComoVistos(
      evaluacionId ? parseInt(evaluacionId) : null,
      evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null,
      user.id,
      alumnoRut
    );

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Mensajes marcados como vistos");
  } catch (error) {
    handleErrorServer(res, 500, "Error al marcar mensajes como vistos", error.message);
  }
}

/**
 * GET /retroalimentacion/conversaciones/:ramoId
 * Obtener conversaciones del profesor
 */
export async function obtenerConversacionesRamo(req, res) {
  try {
    const { ramoId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(res, 403, "Solo profesores pueden ver conversaciones");
    }

    const resultado = await obtenerConversacionesProfesor(user.id, parseInt(ramoId));

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Conversaciones obtenidas", { conversaciones: resultado.data });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener conversaciones", error.message);
  }
}

/**
 * GET /retroalimentacion/no-vistos/:ramoId
 * Obtener mensajes no vistos del alumno
 */
export async function obtenerNoVistos(req, res) {
  try {
    const { ramoId } = req.params;
    const user = req.user;

    if (user.role !== "alumno") {
      return handleErrorClient(res, 403, "Solo alumnos pueden usar este endpoint");
    }

    const resultado = await obtenerMensajesNoVistosAlumno(user.rut, parseInt(ramoId));

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Mensajes no vistos obtenidos", { mensajes: resultado.data });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener mensajes no vistos", error.message);
  }
}