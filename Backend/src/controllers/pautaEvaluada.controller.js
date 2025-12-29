import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { createPautaEvaluadaService, getPautaEvaluadaService, getPautasEvaluadasByEvaluacionService, updatePautaEvaluadaService, deletePautaEvaluadaService, createPautaEvaluadaIntegradoraService, getPautaEvaluadaIntegradoraService, updatePautaEvaluadaIntegradoraService, deletePautaEvaluadaIntegradoraService } from "../services/pautaEvaluada.service.js";
import { createPautaEvaluadaValidation, updatePautaEvaluadaValidation } from "../validations/pautaEvaluada.validation.js";
import { notificarAlumnos } from "../services/notificacionuno.service.js";
import { AppDataSource } from "../config/configDb.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";

const pautaRepository = AppDataSource.getRepository(Pauta);
const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
const evaluacionIntegradoraRepository = AppDataSource.getRepository(EvaluacionIntegradora);

/**
 * Obtiene los emails únicos de alumnos inscritos en un ramo
 */
async function getUniqueAlumnoEmailsByRamoId(ramoId) {
  if (!ramoId) return [];
  const { Ramos } = await import("../entities/ramos.entity.js");
  
  const ramoRepo = AppDataSource.getRepository(Ramos);
  const ramo = await ramoRepo.findOne({
    where: { id: ramoId },
    relations: ["secciones", "secciones.alumnos", "secciones.alumnos.user"],
  });

  const emails = [];
  if (ramo?.secciones?.length) {
    ramo.secciones.forEach((seccion) => {
      if (seccion?.alumnos?.length) {
        seccion.alumnos.forEach((alumno) => {
          if (alumno?.user?.email) emails.push(alumno.user.email);
        });
      }
    });
  }
  return [...new Set(emails)];
}

/**
 * Valida que los puntajes obtenidos tengan las mismas claves que la distribución de puntos
 * y que no excedan los valores máximos asignados
 */
function validatePuntajesVsDistribucion(puntajesObtenidos, distribucionPuntaje) {
  const puntajesKeys = Object.keys(puntajesObtenidos || {}).sort();
  const distribucionKeys = Object.keys(distribucionPuntaje || {}).sort();

  // Comparar arrays de claves
  if (puntajesKeys.length !== distribucionKeys.length) {
    return {
      error: true,
      message: `Los puntajes obtenidos deben tener exactamente ${distribucionKeys.length} criterios. Encontrados: ${puntajesKeys.length}`,
      expected: distribucionKeys,
      received: puntajesKeys
    };
  }

  // Verificar que todas las claves coincidan
  for (let i = 0; i < puntajesKeys.length; i++) {
    if (puntajesKeys[i] !== distribucionKeys[i]) {
      return {
        error: true,
        message: `Las claves de los puntajes no coinciden con la distribución. Se esperaba "${distribucionKeys[i]}" pero se encontró "${puntajesKeys[i]}"`,
        expected: distribucionKeys,
        received: puntajesKeys
      };
    }
  }

  // Verificar que cada puntaje no exceda el máximo asignado
  for (const criterio of distribucionKeys) {
    const puntajeObtenido = Number(puntajesObtenidos[criterio]) || 0;
    const puntajeMaximo = Number(distribucionPuntaje[criterio]) || 0;

    if (puntajeObtenido > puntajeMaximo) {
      return {
        error: true,
        message: `El puntaje obtenido en "${criterio}" (${puntajeObtenido}) no puede ser mayor al máximo asignado (${puntajeMaximo})`
      };
    }
  }

  return { error: false };
}

export async function createPautaEvaluada(req, res) {
  try {
    const { error } = createPautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, pautaId } = req.params;
    const { alumnoRut, puntajes_obtenidos } = req.body;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(res, 403, "Solo el profesor o jefe de carrera puede registrar una pauta evaluada");
    }

    // Obtener la pauta para validar que los puntajes coincidan con la distribución
    const pauta = await pautaRepository.findOneBy({ id: parseInt(pautaId) });
    if (!pauta) return handleErrorClient(res, 400, "Pauta no encontrada");

    // Validar que los puntajes obtenidos coincidan con la distribución de puntos
    const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, pauta.distribucionPuntaje);
    if (validationResult.error) {
      return handleErrorClient(res, 400, validationResult.message);
    }

    // Obtener la evaluación para extraer el codigoRamo
    const evaluacion = await evaluacionRepository.findOneBy({ id: parseInt(evaluacionId) });
    if (!evaluacion) return handleErrorClient(res, 400, "Evaluación no encontrada");

    // Completar los datos que se envían al servicio
    const dataCompleta = {
      ...req.body,
      idEvaluacion: parseInt(evaluacionId),
      idPauta: parseInt(pautaId),
      codigoRamo: evaluacion.codigoRamo,
    };

    const result = await createPautaEvaluadaService(evaluacionId, pautaId, alumnoRut, dataCompleta, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    // Notificar al alumno cuando se crea una pauta evaluada
    try {
      const { User } = await import("../entities/user.entity.js");
      const userRepo = AppDataSource.getRepository(User);
      const alumnoUser = await userRepo.createQueryBuilder("u")
        .where("u.rut = :rut", { rut: alumnoRut })
        .getOne();

      if (alumnoUser?.email) {
        const evaluacion = await evaluacionRepository
          .createQueryBuilder("e")
          .leftJoinAndSelect("e.ramo", "ramo")
          .where("e.id = :evaluacionId", { evaluacionId })
          .getOne();

        if (evaluacion && evaluacion.ramo) {
          await notificarAlumnos(
            [alumnoUser.email],
            `Pauta evaluada registrada: ${evaluacion.titulo}`,
            `Se ha registrado tu pauta evaluada de ${evaluacion.ramo.nombre} - ${evaluacion.titulo}.`,
            evaluacionId
          );
        }
      }
    } catch (notifError) {
      console.warn("Error al notificar alumno (createPautaEvaluada):", notifError.message);
    }

    handleSuccess(res, 201, "Pauta evaluada creada exitosamente", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta evaluada", error.message);
  }
}

export async function getPautaEvaluada(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params;
    const { evaluacionIntegradoraId } = req.query;
    const result = await getPautaEvaluadaService(evaluacionId, alumnoRut, evaluacionIntegradoraId);
    if (result.error) {
      // Retornar 200 con null si no existe la pauta (estudiante aún no evaluado)
      return handleSuccess(res, 200, "Pauta evaluada no encontrada", { pautaEvaluada: null });
    }
    handleSuccess(res, 200, "Pauta evaluada obtenida", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta evaluada", error.message);
  }
}

export async function updatePautaEvaluada(req, res) {
  try {
    const { error } = updatePautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, alumnoRut } = req.params;
    const { evaluacionIntegradoraId } = req.query;
    const { puntajes_obtenidos } = req.body;
    const user = req.user;

    // Si se proporcionan puntajes_obtenidos, validar que coincidan con la distribución
    if (puntajes_obtenidos) {
      // Primero obtener la pautaEvaluada para acceder a la pauta
      const result = await getPautaEvaluadaService(evaluacionId, alumnoRut, evaluacionIntegradoraId);
      if (result.error) return handleErrorClient(res, 404, result.error);

      const distribucion = result.pauta?.distribucionPuntaje || {};
      const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, distribucion);
      if (validationResult.error) {
        return handleErrorClient(res, 400, validationResult.message);
      }
    }

    const result = await updatePautaEvaluadaService(evaluacionId, alumnoRut, req.body, user, evaluacionIntegradoraId);
    if (result.error) return handleErrorClient(res, 400, result.error);

    // Notificar al alumno cuando se actualiza una pauta evaluada
    try {
      const { User } = await import("../entities/user.entity.js");
      const userRepo = AppDataSource.getRepository(User);
      const alumnoUser = await userRepo.createQueryBuilder("u")
        .where("u.rut = :rut", { rut: alumnoRut })
        .getOne();

      if (alumnoUser?.email) {
        const evaluacion = await evaluacionRepository
          .createQueryBuilder("e")
          .leftJoinAndSelect("e.ramo", "ramo")
          .where("e.id = :evaluacionId", { evaluacionId: evaluacionId || evaluacionIntegradoraId })
          .getOne();

        if (evaluacion && evaluacion.ramo) {
          await notificarAlumnos(
            [alumnoUser.email],
            `Pauta evaluada actualizada: ${evaluacion.titulo}`,
            `Tu pauta evaluada de ${evaluacion.ramo.nombre} - ${evaluacion.titulo} ha sido actualizada.`,
            evaluacionId || evaluacionIntegradoraId
          );
        }
      }
    } catch (notifError) {
      console.warn("Error al notificar alumno (updatePautaEvaluada):", notifError.message);
    }

    handleSuccess(res, 200, "Pauta evaluada actualizada", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta evaluada", error.message);
  }
}

export async function getPautasEvaluadasByEvaluacion(req, res) {
  try {
    const { evaluacionId } = req.params;
    const { evaluacionIntegradoraId } = req.query;
    const result = await getPautasEvaluadasByEvaluacionService(evaluacionId, evaluacionIntegradoraId);
    if (result.error) return handleErrorClient(res, 404, result.error);
    handleSuccess(res, 200, "Pautas evaluadas obtenidas", { pautasEvaluadas: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pautas evaluadas", error.message);
  }
}

export async function deletePautaEvaluada(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params;
    const { evaluacionIntegradoraId } = req.query;
    const user = req.user;

    const result = await deletePautaEvaluadaService(evaluacionId, alumnoRut, user, evaluacionIntegradoraId);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, result.message, {});
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta evaluada", error.message);
  }
}

// ========== INTEGRADORA ==========

export async function createPautaEvaluadaIntegradora(req, res) {
  try {
    const { error } = createPautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, pautaId } = req.params; // evaluacionId es en realidad evaluacionIntegradoraId
    const { alumnoRut, puntajes_obtenidos } = req.body;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(res, 403, "Solo el profesor o jefe de carrera puede registrar una pauta evaluada integradora");
    }

    // Obtener la pauta para validar que los puntajes coincidan con la distribución
    const pauta = await pautaRepository.findOneBy({ id: parseInt(pautaId) });
    if (!pauta) return handleErrorClient(res, 400, "Pauta no encontrada");

    // Validar que los puntajes obtenidos coincidan con la distribución de puntos
    const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, pauta.distribucionPuntaje);
    if (validationResult.error) {
      return handleErrorClient(res, 400, validationResult.message);
    }

    // Obtener la evaluación integradora
    const evaluacionIntegradora = await evaluacionIntegradoraRepository.findOneBy({ id: parseInt(evaluacionId) });
    if (!evaluacionIntegradora) return handleErrorClient(res, 400, "Evaluación integradora no encontrada");

    // Completar los datos que se envían al servicio
    const dataCompleta = {
      ...req.body,
      idEvaluacionIntegradora: parseInt(evaluacionId),
      idPauta: parseInt(pautaId),
    };

    const result = await createPautaEvaluadaIntegradoraService(evaluacionId, pautaId, alumnoRut, dataCompleta, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    // Notificar al alumno si la pauta fue publicada
    try {
      if (req.body.pautaPublicada) {
        const evaluacionIntegradora = await evaluacionIntegradoraRepository
          .createQueryBuilder("ei")
          .leftJoinAndSelect("ei.ramo", "ramo")
          .where("ei.id = :evaluacionId", { evaluacionId })
          .getOne();

        if (evaluacionIntegradora && evaluacionIntegradora.ramo) {
          const { User } = await import("../entities/user.entity.js");
          const userRepo = AppDataSource.getRepository(User);
          const alumnoUser = await userRepo.createQueryBuilder("u")
            .where("u.rut = :rut", { rut: alumnoRut })
            .getOne();

          if (alumnoUser?.email) {
            const titulo = `Nota de ${evaluacionIntegradora.titulo} de ${evaluacionIntegradora.ramo.nombre} publicada`;
            const mensaje = "Se publicó el resultado de tu evaluación. Ya puedes revisarla.";
            await notificarAlumnos([alumnoUser.email], titulo, mensaje, null);
          }
        }
      }
    } catch (notifError) {
      console.warn("Error al notificar alumno (createPautaEvaluadaIntegradora):", notifError.message);
    }

    handleSuccess(res, 201, "Pauta evaluada integradora creada exitosamente", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta evaluada integradora", error.message);
  }
}

export async function getPautaEvaluadaIntegradora(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params; // evaluacionId es en realidad evaluacionIntegradoraId
    const result = await getPautaEvaluadaIntegradoraService(evaluacionId, alumnoRut);
    if (result.error) {
      // Retornar 200 con null si no existe la pauta (estudiante aún no evaluado)
      return handleSuccess(res, 200, "Pauta evaluada integradora no encontrada", { pautaEvaluada: null });
    }
    handleSuccess(res, 200, "Pauta evaluada integradora obtenida", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta evaluada integradora", error.message);
  }
}

export async function updatePautaEvaluadaIntegradora(req, res) {
  try {
    const { error } = updatePautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, alumnoRut } = req.params; // evaluacionId es en realidad evaluacionIntegradoraId
    const { puntajes_obtenidos } = req.body;
    const user = req.user;

    // Si se proporcionan puntajes_obtenidos, validar que coincidan con la distribución
    if (puntajes_obtenidos) {
      // Primero obtener la pautaEvaluada para acceder a la pauta
      const result = await getPautaEvaluadaIntegradoraService(evaluacionId, alumnoRut);
      if (result.error) return handleErrorClient(res, 404, result.error);

      const distribucion = result.pauta?.distribucionPuntaje || {};
      const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, distribucion);
      if (validationResult.error) {
        return handleErrorClient(res, 400, validationResult.message);
      }
    }

    const result = await updatePautaEvaluadaIntegradoraService(evaluacionId, alumnoRut, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    // Notificar al alumno si la pauta fue publicada
    try {
      if (req.body.pautaPublicada) {
        const evaluacionIntegradora = await evaluacionIntegradoraRepository
          .createQueryBuilder("ei")
          .leftJoinAndSelect("ei.ramo", "ramo")
          .where("ei.id = :evaluacionId", { evaluacionId })
          .getOne();

        if (evaluacionIntegradora && evaluacionIntegradora.ramo) {
          const { User } = await import("../entities/user.entity.js");
          const userRepo = AppDataSource.getRepository(User);
          const alumnoUser = await userRepo.createQueryBuilder("u")
            .where("u.rut = :rut", { rut: alumnoRut })
            .getOne();

          if (alumnoUser?.email) {
            const titulo = `Nota de ${evaluacionIntegradora.titulo} de ${evaluacionIntegradora.ramo.nombre} publicada`;
            const mensaje = "Se publicó el resultado de tu evaluación. Ya puedes revisarla.";
            await notificarAlumnos([alumnoUser.email], titulo, mensaje, null);
          }
        }
      }
    } catch (notifError) {
      console.warn("Error al notificar alumno (pautaEvaluadaIntegradora):", notifError.message);
    }

    handleSuccess(res, 200, "Pauta evaluada integradora actualizada", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta evaluada integradora", error.message);
  }
}

export async function deletePautaEvaluadaIntegradora(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params; // evaluacionId es en realidad evaluacionIntegradoraId
    const user = req.user;

    const result = await deletePautaEvaluadaIntegradoraService(evaluacionId, alumnoRut, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, result.message, {});
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta evaluada integradora", error.message);
  }
}
