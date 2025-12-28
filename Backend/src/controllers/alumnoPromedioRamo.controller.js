import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  obtenerPromedioFinal,
  obtenerPromediosPorRamo,
  guardarPromedioFinal,
  guardarPromedioParcial,
  obtenerPromediosByAlumno,
  calcularPromediosParcialRamo,
  calcularPromediosFinalRamo,
} from "../services/alumnoPromedioRamo.service.js";
import { query } from "../config/database.js";

/**
 * GET /promedios/alumno/:alumnoRut
 * Obtiene todos los promedios de un alumno en todos sus ramos
 */
export async function getPromediosByAlumno(req, res) {
  try {
    const { alumnoRut } = req.params;
    const user = req.user;

    // Validar que el alumno solo vea sus propios promedios
    if (user.role === "alumno" && user.rut !== alumnoRut) {
      return handleErrorClient(res, 403, "No tiene permiso para ver estos promedios");
    }

    const resultado = await obtenerPromediosByAlumno(alumnoRut);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Promedios del alumno obtenidos", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener promedios del alumno", error.message);
  }
}

/**
 * GET /promedios/:codigoRamo/alumno/:alumnoRut/promedio
 * Obtiene el promedio final de un alumno en un ramo
 */
export async function getPromedioFinal(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;
    const user = req.user;

    // Validar que el alumno solo vea su propio promedio
    if (user.role === "alumno" && user.rut !== alumnoRut) {
      return handleErrorClient(res, 403, "No tiene permiso para ver este promedio");
    }

    const resultado = await obtenerPromedioFinal(alumnoRut, codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Promedio final obtenido", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener promedio final", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/alumno/:alumnoRut/parcial
 * Calcula y guarda solo el promedio parcial (sin integradora)
 */
export async function createPromedioParcial(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;

    const resultado = await guardarPromedioParcial(alumnoRut, codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Promedio parcial calculado y guardado", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear promedio parcial", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/alumno/:alumnoRut/final
 * Calcula y guarda el promedio final (incluyendo integradora si existe)
 * Requiere que ya exista un promedio parcial
 */
export async function createPromedioFinal(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;

    const resultado = await guardarPromedioFinal(alumnoRut, codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Promedio final calculado y guardado", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear promedio final", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/alumno/:alumnoRut (antiguo, mantener compatibilidad)
 * Calcula y crea el promedio final de un alumno en un ramo
 */
export async function createPromedioFinalLegacy(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;

    const resultado = await guardarPromedioFinal(alumnoRut, codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Promedio final calculado y guardado", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear promedio final", error.message);
  }
}

/**
 * PATCH /promedios/:codigoRamo/alumno/:alumnoRut
 * Actualiza el promedio parcial cuando cambia una nota (recalcula automáticamente)
 */
export async function updatePromedioFinal(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;

    const resultado = await guardarPromedioParcial(alumnoRut, codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Promedio parcial actualizado", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar promedio parcial", error.message);
  }
}

/**
 * GET /promedios/:ramoId/promedios
 * Obtiene los promedios de TODOS los alumnos en un ramo (solo profesor)
 */
export async function getPromediosPorRamo(req, res) {
  try {
    const { codigoRamo } = req.params;

    const resultado = await obtenerPromediosPorRamo(codigoRamo);
    
    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Promedios obtenidos", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener promedios", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/calcular-todos
 * Calcula promedios para TODOS los alumnos inscritos en un ramo
 * Solo para profesores y jefes de carrera
 */
export async function calcularPromediosRamo(req, res) {
  try {
    const { codigoRamo } = req.params;
    const user = req.user;

    console.log("👨‍🏫 calcularPromediosRamo called", { codigoRamo, user: user?.email, role: user?.role });

    // Validar que solo profesores y jefes de carrera puedan hacer esto
    if (!user || (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin")) {
      console.error("❌ Unauthorized attempt", { user: user?.email, role: user?.role });
      return handleErrorClient(res, 403, "Solo profesores y jefes de carrera pueden calcular promedios");
    }

    // Obtener todos los alumnos inscritos en este ramo (a través de sus secciones)
    const result = await query(
      `SELECT DISTINCT u."rut" as "alumnoRut"
       FROM alumnos a
       INNER JOIN users u ON a."id" = u."id"
       INNER JOIN seccion_alumnos sa ON a."id" = sa."alumno_id"
       INNER JOIN secciones s ON sa."seccion_id" = s."id"
       INNER JOIN ramos r ON s."ramo_id" = r."id"
       WHERE r.codigo = $1`,
      [codigoRamo]
    );

    const inscritos = result.rows;

    console.log(`📊 Found ${inscritos?.length} students in ${codigoRamo}`);

    if (!inscritos || inscritos.length === 0) {
      return handleErrorClient(res, 400, "No hay alumnos inscritos en este ramo");
    }

    let exitosos = 0;
    let errores = 0;

    // Calcular promedio para cada alumno
    // Si el alumno tiene una pauta en NULL, su promedio será NULL (pendiente)
    for (const inscrito of inscritos) {
      try {
        await guardarPromedioFinal(inscrito.alumnoRut, codigoRamo);
        exitosos++;
      } catch (error) {
        console.error(`❌ Error calculando promedio para ${inscrito.alumnoRut}:`, error.message);
        errores++;
      }
    }

    console.log(`✅ Calculation complete: ${exitosos} successful, ${errores} failed`);

    const message = `Promedios calculados: ${exitosos} exitosos${errores > 0 ? `, ${errores} con error` : ""}`;
    handleSuccess(res, 200, message, {
      exitosos,
      errores,
      total: inscritos.length
    });
  } catch (error) {
    console.error("🔴 Error in calcularPromediosRamo:", error);
    handleErrorServer(res, 500, "Error al calcular promedios", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/calcular-todos-parcial
 * Calcula y guarda promedio PARCIAL para TODOS los alumnos inscritos en un ramo
 * Solo para profesores y jefes de carrera
 */
export async function calcularTodosParcial(req, res) {
  try {
    const { codigoRamo } = req.params;
    const user = req.user;

    console.log("👨‍🏫 calcularTodosParcial called", { codigoRamo, user: user?.email, role: user?.role });

    // Validar que solo profesores y jefes de carrera puedan hacer esto
    if (!user || (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin")) {
      console.error("❌ Unauthorized attempt", { user: user?.email, role: user?.role });
      return handleErrorClient(res, 403, "Solo profesores y jefes de carrera pueden calcular promedios");
    }

    // Obtener todos los alumnos inscritos en este ramo
    const result = await query(
      `SELECT DISTINCT u."rut" as "alumnoRut"
       FROM alumnos a
       INNER JOIN users u ON a."id" = u."id"
       INNER JOIN seccion_alumnos sa ON a."id" = sa."alumno_id"
       INNER JOIN secciones s ON sa."seccion_id" = s."id"
       INNER JOIN ramos r ON s."ramo_id" = r."id"
       WHERE r.codigo = $1`,
      [codigoRamo]
    );

    const inscritos = result.rows;

    console.log(`📊 Found ${inscritos?.length} students in ${codigoRamo}`);

    if (!inscritos || inscritos.length === 0) {
      return handleErrorClient(res, 400, "No hay alumnos inscritos en este ramo");
    }

    const resultado = await calcularPromediosParcialRamo(inscritos, codigoRamo);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    console.log(`✅ Parcial calculation complete:`, resultado.data);

    handleSuccess(res, 200, resultado.data.message, resultado.data);
  } catch (error) {
    console.error("🔴 Error in calcularTodosParcial:", error);
    handleErrorServer(res, 500, "Error al calcular promedios parciales", error.message);
  }
}

/**
 * POST /promedios/:codigoRamo/calcular-todos-final
 * Calcula y guarda promedio FINAL para TODOS los alumnos inscritos en un ramo
 * Solo para profesores y jefes de carrera
 */
export async function calcularTodosFinal(req, res) {
  try {
    const { codigoRamo } = req.params;
    const user = req.user;

    console.log("👨‍🏫 calcularTodosFinal called", { codigoRamo, user: user?.email, role: user?.role });

    // Validar que solo profesores y jefes de carrera puedan hacer esto
    if (!user || (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin")) {
      console.error("❌ Unauthorized attempt", { user: user?.email, role: user?.role });
      return handleErrorClient(res, 403, "Solo profesores y jefes de carrera pueden calcular promedios");
    }

    // Obtener todos los alumnos inscritos en este ramo
    const result = await query(
      `SELECT DISTINCT u."rut" as "alumnoRut"
       FROM alumnos a
       INNER JOIN users u ON a."id" = u."id"
       INNER JOIN seccion_alumnos sa ON a."id" = sa."alumno_id"
       INNER JOIN secciones s ON sa."seccion_id" = s."id"
       INNER JOIN ramos r ON s."ramo_id" = r."id"
       WHERE r.codigo = $1`,
      [codigoRamo]
    );

    const inscritos = result.rows;

    console.log(`📊 Found ${inscritos?.length} students in ${codigoRamo}`);

    if (!inscritos || inscritos.length === 0) {
      return handleErrorClient(res, 400, "No hay alumnos inscritos en este ramo");
    }

    const resultado = await calcularPromediosFinalRamo(inscritos, codigoRamo);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    console.log(`✅ Final calculation complete:`, resultado.data);

    handleSuccess(res, 200, resultado.data.message, resultado.data);
  } catch (error) {
    console.error("🔴 Error in calcularTodosFinal:", error);
    handleErrorServer(res, 500, "Error al calcular promedios finales", error.message);
  }
}
