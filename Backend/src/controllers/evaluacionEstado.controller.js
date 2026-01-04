import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDB.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";

/**
 * Cambiar estado de una evaluación
 * PUT /api/evaluaciones/:id/estado
 * Body: { estado: 'cancelado' | 'reagendar' | 'confirmado', motivo_cambio?: string }
 */
export async function cambiarEstadoEvaluacion(req, res) {
  try {
    const { id } = req.params;
    const { estado, motivo_cambio } = req.body;
    const user = req.user;

    // Validar permiso (solo profesor de la evaluación)
    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
    const evaluacion = await evaluacionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["profesor"],
    });

    if (!evaluacion) {
      return handleErrorClient(res, 404, "Evaluación no encontrada");
    }

    // Validar que sea profesor de la evaluación
    if (evaluacion.profesor?.id !== user.id && user.rol !== "jefe") {
      return handleErrorClient(res, 403, "No tienes permiso para cambiar el estado de esta evaluación");
    }

    // Validar estado válido
    const estadosValidos = ["pendiente", "confirmado", "cancelado", "reagendar", "aplicada", "finalizada"];
    if (!estadosValidos.includes(estado)) {
      return handleErrorClient(res, 400, `Estado inválido. Debe ser uno de: ${estadosValidos.join(", ")}`);
    }

    // Validar que cancelado y reagendar requieren motivo
    if ((estado === "cancelado" || estado === "reagendar") && !motivo_cambio?.trim()) {
      return handleErrorClient(res, 400, `El estado "${estado}" requiere un comentario (motivo_cambio)`);
    }

    // Actualizar evaluación
    evaluacion.estado = estado;
    if (motivo_cambio?.trim()) {
      evaluacion.motivo_cambio = motivo_cambio.trim();
    }

    await evaluacionRepo.save(evaluacion);

    return handleSuccess(res, 200, "Estado actualizado exitosamente", { evaluacion });
  } catch (error) {
    console.error("Error en cambiarEstadoEvaluacion:", error);
    handleErrorServer(res, 500, "Error al cambiar estado", error.message);
  }
}

/**
 * Obtener una evaluación específica por ID
 * GET /api/evaluaciones/:id
 */
export async function getEvaluacionPorId(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
    const evaluacion = await evaluacionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["profesor", "ramo", "slots"],
    });

    if (!evaluacion) {
      return handleErrorClient(res, 404, "Evaluación no encontrada");
    }

    // Validar acceso
    const esProfesor = evaluacion.profesor?.id === user.id;
    const esJefe = user.rol === "jefe";
    const esAlumno = user.rol === "alumno" || user.rol === "estudiante";

    if (!esProfesor && !esJefe && !esAlumno) {
      return handleErrorClient(res, 403, "No tienes permiso para ver esta evaluación");
    }

    return handleSuccess(res, 200, "Evaluación obtenida exitosamente", { evaluacion });
  } catch (error) {
    console.error("Error en getEvaluacionPorId:", error);
    handleErrorServer(res, 500, "Error al obtener evaluación", error.message);
  }
}
