import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  getAllEvaluacionesService,
  getEvaluacionByIdService,
  createEvaluacionService,
  updateEvaluacionService,
  deleteEvaluacionService,
} from "../services/evaluacion.service.js";
import { createEvaluacionValidation, updateEvaluacionValidation } from "../validations/evaluacion.validation.js";

export async function getEvaluaciones(req, res) {
  try {
    const user = req.user;
    const evaluaciones = await getAllEvaluacionesService(user);

    handleSuccess(res, 200, "Evaluacion obtenida exitosamente", { evaluaciones });
  } catch (error) {
      handleErrorServer(res, 500,"Error al obtener evaluaciones", error.message);
  }
}

export async function getEvaluacionById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const evaluacion = await getEvaluacionByIdService(id, user);

    if (!evaluacion) {
      return handleErrorClient(res, 404, "Evaluación no encontrada");
    }

    handleSuccess(res, 200, "Evaluación obtenida exitosamente", { evaluacion });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener evaluación", error.message);
  }
}


import { syncEvaluacionWithEvent } from "../utils/evaluation-event.utils.js";

export async function createEvaluacion(req, res) {
  try {
    const user = req.user;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const {error} = createEvaluacionValidation.validate(req.body, {
      context: { tomorrow }
    });
    if(error) return res.status(400).json({message: error.message});

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede crear evaluaciones");
    }

    const { titulo, fechaProgramada, ponderacion, contenidos, ramo_id } = req.body;

    const nuevaEvaluacion = await createEvaluacionService({
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      ramo_id,
      creadaPor: user.id,
      aplicada: false
    });

    await syncEvaluacionWithEvent(nuevaEvaluacion, user, false);

    handleSuccess(res, 201,"Evaluación creada exitosamente",{ evaluacion: nuevaEvaluacion });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear evaluación", error.message);
    res.status(500).json({message: error.message})
  }
}

export async function updateEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {error} = updateEvaluacionValidation.validate(req.body);
    if(error) return res.status(400).json({message: error.message});

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo los profesor pueden modificar evaluaciones");
    }

    const { titulo, fechaProgramada, ponderacion, contenidos, pauta, aplicada } = req.body;

    const evaluacionActualizada = await updateEvaluacionService(id, {
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      pauta,
      aplicada,
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación ");
    }

    handleSuccess(res, 200, "Evaluación actualizada exitosamente", { evaluacion: evaluacionActualizada });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar evaluación", error.message);
    res.status(500).json({message:error.messaje});
  }
}

export async function deleteEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo el profesor puede eliminar evaluaciones");
    }

    const eliminada =await deleteEvaluacionService(id,user.id);

    if (!eliminada) {
      return  handleErrorClient(res, 404,"No se pudo eliminar la evaluación ");
    }

    handleSuccess(res, 200,"Evaluación eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res,500, "Error al eliminar evaluación", error.message);
  }
}

export async function getMisEventos(req, res) {
  try {
    const user = req.user;
    const { fechaInicio, fechaFin } = req.query;

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo profesores pueden acceder a esta funcionalidad");
    }

    // Simulamos obtener eventos para el rango de fechas
    const eventos = await getAllEvaluacionesService(user);
    
    const eventosFiltrados = (eventos || []).filter(evento => {
      if (!evento.fechaProgramada) return false;
      const fecha = new Date(evento.fechaProgramada);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;
      
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    }).map(ev => ({
      id: ev.id,
      nombre: ev.titulo,
      descripcion: ev.contenidos,
      fechaInicio: ev.fechaProgramada,
      fechaFin: ev.fechaProgramada,
      estado: ev.aplicada ? 'confirmado' : 'pendiente',
      ramoId: ev.ramo_id,
      cupoMaximo: 40,
      duracionPorAlumno: null
    }));

    handleSuccess(res, 200, "Eventos obtenidos exitosamente", { eventos: eventosFiltrados });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener eventos", error.message);
  }
}

export async function crearEventoFlexible(req, res) {
  try {
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede crear eventos");
    }

    const {
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      tipoEvento,
      modalidad,
      linkOnline,
      sala,
      ramoId,
      seccionId,
      duracionPorAlumno,
      cupoMaximo,
      tipoInscripcion,
      tamanioGrupo,
      alumnosEmails
    } = req.body;

    // Validaciones básicas
    if (!nombre || !fechaInicio || !fechaFin) {
      return handleErrorClient(res, 400, "Nombre, fecha inicio y fecha fin son obligatorios");
    }

    // Convertir a formato que el servicio espera
    const nuevaEvaluacion = await createEvaluacionService({
      titulo: nombre,
      fechaProgramada: fechaInicio,
      ponderacion: 0,
      contenidos: descripcion || '',
      ramo_id: ramoId || null,
      creadaPor: user.id,
      aplicada: false
    });

    handleSuccess(res, 201, "Evento creado exitosamente", { 
      evaluacion: nuevaEvaluacion,
      evento: {
        id: nuevaEvaluacion.id,
        nombre: nuevaEvaluacion.titulo,
        descripcion: nuevaEvaluacion.contenidos,
        fechaInicio: nuevaEvaluacion.fechaProgramada,
        fechaFin: nuevaEvaluacion.fechaProgramada,
        estado: 'pendiente',
        modalidad,
        sala,
        linkOnline,
        cupoMaximo,
        duracionPorAlumno
      }
    });
  } catch (error) {
    console.error("Error al crear evento flexible:", error);
    handleErrorServer(res, 500, "Error al crear evento", error.message);
  }
}
