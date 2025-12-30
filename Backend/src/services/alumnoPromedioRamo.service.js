import { AppDataSource } from "../config/configDB.js";
import { AlumnoPromedioRamo } from "../entities/alumnoPromedioRamo.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { PautaEvaluadaIntegradora } from "../entities/pautaEvaluadaIntegradora.entity.js";
import { Ramos } from "../entities/ramos.entity.js";

const promedioRepo = AppDataSource.getRepository(AlumnoPromedioRamo);
const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
const pautaEvaluadaRepo = AppDataSource.getRepository(PautaEvaluada);
const evaluacionIntegradoraRepo = AppDataSource.getRepository(EvaluacionIntegradora);
const pautaIntegradoraRepo = AppDataSource.getRepository(PautaEvaluadaIntegradora);
const ramosRepo = AppDataSource.getRepository(Ramos);

/**
 * Calcula el promedio final de un alumno en un ramo
 * Promedio Parcial: Σ(notaFinal × ponderacion) de todas las evaluaciones
 * Promedio Final: 
 *   - Si NO hay integradora o nota integradora es NULL → promedio final = promedio parcial
 *   - Si hay integradora con nota → promedio final = promedio parcial * 0.6 + nota integradora * 0.4
 * 
 * @param {string} alumnoRut - RUT del alumno
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise<Object>} { promedioParcial, promedioFinal, promedioOficial, notaIntegradora, estado }
 */
export async function calcularPromedioFinal(alumnoRut, codigoRamo) {
  try {
    // Obtener ramo
    const ramo = await ramosRepo.findOne({
      where: { codigo: codigoRamo },
    });

    if (!ramo) {
      return { error: "Ramo no encontrado" };
    }

    // Obtener todas las evaluaciones del ramo (sin integradora)
    const evaluaciones = await evaluacionRepo.find({
      where: { ramo: { codigo: codigoRamo } },
      order: { id: "ASC" },
    });

    if (evaluaciones.length === 0) {
      return {
        error: "No hay evaluaciones registradas para este ramo",
      };
    }

    // Obtener notas del alumno en cada evaluación
    const notasAlumno = [];

    for (const evaluacion of evaluaciones) {
      const pautaEvaluada = await pautaEvaluadaRepo.findOne({
        where: {
          alumnoRut,
          idEvaluacion: evaluacion.id,
        },
      });

      const notaFinal = pautaEvaluada?.notaFinal;

      // Si falta una nota → PENDIENTE
      if (notaFinal === null || notaFinal === undefined) {
        return {
          promedioParcial: null,
          promedioFinal: null,
          promedioOficial: null,
          notaIntegradora: null,
          estado: "pendiente",
        };
      }

      notasAlumno.push({
        nota: Number(notaFinal),
        ponderacion: evaluacion.ponderacion,
      });
    }

    // Calcular promedio parcial
    const sumaPonderaciones = notasAlumno.reduce((sum, item) => sum + item.ponderacion, 0);
    
    // Validar que la suma de ponderaciones sea exactamente 100
    if (sumaPonderaciones !== 100) {
      const detallesEvaluaciones = notasAlumno
        .map(item => `${item.nombre} (${item.ponderacion}%)`)
        .join(', ');
      
      return {
        promedioParcial: null,
        promedioFinal: null,
        promedioOficial: null,
        notaIntegradora: null,
        estado: "pendiente",
        error: `La suma de ponderaciones debe ser 100%. Actualmente es ${sumaPonderaciones}%.\n\nEvaluaciones: ${detallesEvaluaciones}`,
        evaluacionesDetalle: notasAlumno,
      };
    }
    
    let promedioParcial = 0;
    
    if (sumaPonderaciones > 0) {
      promedioParcial = notasAlumno.reduce(
        (sum, item) => sum + (item.nota * item.ponderacion),
        0
      ) / sumaPonderaciones;
    }

    // Obtener nota integradora si existe
    let notaIntegradora = null;
    const evaluacionIntegradora = await evaluacionIntegradoraRepo.findOne({
      where: { ramoId: ramo.id },
    });

    if (evaluacionIntegradora) {
      const pautaIntegradora = await pautaIntegradoraRepo.findOne({
        where: { evaluacionIntegradoraId: evaluacionIntegradora.id, alumnoRut },
      });
      notaIntegradora = pautaIntegradora?.notaFinal ? Number(pautaIntegradora.notaFinal) : null;
    }

    // Calcular promedio final
    let promedioFinal = promedioParcial;
    if (notaIntegradora !== null) {
      // Si hay integradora: 60% parcial + 40% integradora
      promedioFinal = (promedioParcial * 0.6) + (notaIntegradora * 0.4);
    }

    // Redondear a 1 decimal
    const promedioOficial = Math.round(promedioFinal * 10) / 10;

    // Determinar estado
    const estado = promedioOficial >= 4.0 ? "aprobado" : "reprobado";

    return {
      promedioParcial: Math.round(promedioParcial * 10) / 10,
      promedioFinal,
      promedioOficial,
      notaIntegradora,
      estado,
    };
  } catch (error) {
    console.error("Error al calcular promedio final:", error);
    return { error: error.message };
  }
}

/**
 * Guarda solo el promedio parcial (sin integradora) en la BD
 * Usado cuando se calcula el promedio parcial sin integradora
 * 
 * @param {string} alumnoRut - RUT del alumno
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise<Object>} Resultado con datos guardados
 */
export async function guardarPromedioParcial(alumnoRut, codigoRamo) {
  try {
    // Obtener el ID del ramo basándose en el código
    const ramo = await evaluacionRepo.manager.query(
      `SELECT id FROM ramos WHERE codigo = $1`,
      [codigoRamo]
    );
    
    if (!ramo || ramo.length === 0) {
      return { error: "Ramo no encontrado" };
    }
    
    const ramoId = ramo[0].id;
    
    // Calcular promedio (obtiene promedioParcial)
    const resultado = await calcularPromedioFinal(alumnoRut, codigoRamo);

    if (resultado.error) {
      return resultado;
    }

    // Si el promedio parcial es null, significa que faltan notas
    if (resultado.promedioParcial === null) {
      return { error: "No se puede calcular el promedio: faltan notas de evaluaciones" };
    }

    // Buscar si ya existe
    let promedio = await promedioRepo.findOne({
      where: { alumnoRut, ramoId },
    });

    let esActualizacion = false;

    if (promedio) {
      // Actualizar solo el promedio parcial
      esActualizacion = true;
      promedio.promedioParcial = resultado.promedioParcial;
      // No cambiar promedioFinal ni estado si ya tiene integradora
      if (!promedio.notaIntegradora) {
        promedio.promedioFinal = resultado.promedioParcial;
        promedio.promedioOficial = Math.round(resultado.promedioParcial * 10) / 10;
        promedio.estado = resultado.estado;
      }
    } else {
      // Crear nuevo
      esActualizacion = false;
      promedio = promedioRepo.create({
        alumnoRut,
        ramoId,
        promedioParcial: resultado.promedioParcial,
        promedioFinal: resultado.promedioParcial, // Inicialmente igual al parcial
        promedioOficial: Math.round(resultado.promedioParcial * 10) / 10,
        notaIntegradora: null,
        estado: resultado.estado,
      });
    }

    const guardado = await promedioRepo.save(promedio);
    return { 
      success: true, 
      data: guardado,
      operacion: esActualizacion ? "actualizado" : "creado"
    };
  } catch (error) {
    console.error("Error al guardar promedio parcial:", error);
    return { error: error.message };
  }
}

/**
 * Guarda el promedio final (incluyendo integradora si existe)
 * Requiere que ya exista un promedio parcial guardado
 * 
 * @param {string} alumnoRut - RUT del alumno
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise<Object>} Resultado con datos guardados
 */
export async function guardarPromedioFinal(alumnoRut, codigoRamo) {
  try {
    // Obtener el ID del ramo basándose en el código
    const ramo = await evaluacionRepo.manager.query(
      `SELECT id FROM ramos WHERE codigo = $1`,
      [codigoRamo]
    );
    
    if (!ramo || ramo.length === 0) {
      return { error: "Ramo no encontrado" };
    }
    
    const ramoId = ramo[0].id;

    // Primero verificar que ya existe un promedio parcial
    const promedio = await promedioRepo.findOne({
      where: { alumnoRut, ramoId },
    });

    if (!promedio || promedio.promedioParcial === null) {
      return { error: "Debe calcular el promedio parcial primero" };
    }
    
    // Calcular promedio final (incluyendo integradora)
    const resultado = await calcularPromedioFinal(alumnoRut, codigoRamo);

    if (resultado.error) {
      return resultado;
    }

    // Actualizar con el promedio final
    promedio.notaIntegradora = resultado.notaIntegradora;
    promedio.promedioFinal = resultado.promedioFinal;
    promedio.promedioOficial = resultado.promedioOficial;
    promedio.estado = resultado.estado;

    const guardado = await promedioRepo.save(promedio);
    return { 
      success: true, 
      data: guardado,
      operacion: "actualizado"  // guardarPromedioFinal siempre es PATCH porque requiere que exista parcial
    };
  } catch (error) {
    console.error("Error al guardar promedio final:", error);
    return { error: error.message };
  }
}

/**
 * Obtiene el promedio final de un alumno en un ramo
 * 
 * @param {string} alumnoRut 
 * @param {string} codigoRamo 
 * @returns {Promise<Object>}
 */
export async function obtenerPromedioFinal(alumnoRut, codigoRamo) {
  try {
    // Obtener el ID del ramo basándose en el código
    const ramo = await evaluacionRepo.manager.query(
      `SELECT id FROM ramos WHERE codigo = $1`,
      [codigoRamo]
    );
    
    if (!ramo || ramo.length === 0) {
      return { error: "Ramo no encontrado" };
    }
    
    const ramoId = ramo[0].id;
    
    let promedio = await promedioRepo.findOne({
      where: { alumnoRut, ramoId },
    });

    if (!promedio) {
      // Si no existe, intentar crear promedioParcial automáticamente
      const resultadoParcial = await guardarPromedioParcial(alumnoRut, codigoRamo);
      
      if (resultadoParcial.error) {
        // Si falla (p.ej. faltan notas), retornar estructura vacía
        return { 
          success: true, 
          data: {
            alumnoRut,
            ramoId,
            promedioParcial: null,
            promedioFinal: null,
            notaIntegradora: null,
            estado: "pendiente"
          }
        };
      }
      
      promedio = resultadoParcial.data;
    }

    // Procesar el promedio: asegurar que promedioParcial y promedioFinal estén redondeados
    const resultado = {
      id: promedio.id,
      alumnoRut: promedio.alumnoRut,
      ramoId: promedio.ramoId,
      promedioParcial: promedio.promedioParcial !== null 
        ? Math.round(promedio.promedioParcial * 10) / 10 
        : null,
      promedioFinal: promedio.promedioFinal !== null 
        ? Math.round(promedio.promedioFinal * 10) / 10 
        : null,
      notaIntegradora: promedio.notaIntegradora !== null 
        ? Math.round(promedio.notaIntegradora * 10) / 10 
        : null,
      estado: promedio.estado
    };

    return { success: true, data: resultado };
  } catch (error) {
    console.error("Error al obtener promedio final:", error);
    return { error: error.message };
  }
}

/**
 * Obtiene promedios de TODOS los alumnos en un ramo
 * 
 * @param {string} codigoRamo 
 * @returns {Promise<Array>}
 */
export async function obtenerPromediosPorRamo(codigoRamo) {
  try {
    // Obtener el ID del ramo basándose en el código
    const ramo = await evaluacionRepo.manager.query(
      `SELECT id FROM ramos WHERE codigo = $1`,
      [codigoRamo]
    );
    
    if (!ramo || ramo.length === 0) {
      return { error: "Ramo no encontrado" };
    }
    
    const ramoId = ramo[0].id;
    
    const promedios = await promedioRepo.find({
      where: { ramoId },
      order: { promedioOficial: "DESC" },
    });

    if (!promedios || promedios.length === 0) {
      return { error: "No hay promedios registrados para este ramo" };
    }

    return { success: true, data: promedios };
  } catch (error) {
    console.error("Error al obtener promedios por ramo:", error);
    return { error: error.message };
  }
}

/**
 * Obtiene todos los promedios de un alumno en todos sus ramos
 * 
 * @param {string} alumnoRut 
 * @returns {Promise<Array>}
 */
export async function obtenerPromediosByAlumno(alumnoRut) {
  try {
    const promedios = await promedioRepo.find({
      where: { alumnoRut },
      relations: ["ramo"],
      order: { promedioOficial: "DESC" },
    });

    if (!promedios || promedios.length === 0) {
      return { error: "No hay promedios registrados para este alumno" };
    }

    return { success: true, data: promedios };
  } catch (error) {
    console.error("Error al obtener promedios del alumno:", error);
    return { error: error.message };
  }
}

/**
 * Calcula y guarda promedio PARCIAL para TODOS los alumnos inscritos en un ramo
 * Usado por el botón "Calcular Promedio Parcial"
 * 
 * @param {Array} inscritos - Lista de alumnos inscritos con su RUT
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise<Object>} {exitosos, creados, actualizados, errores, total}
 */
export async function calcularPromediosParcialRamo(inscritos, codigoRamo) {
  try {
    let exitosos = 0;
    let creados = 0;
    let actualizados = 0;
    let errores = 0;

    // Calcular promedio parcial para cada alumno
    for (const inscrito of inscritos) {
      try {
        const resultado = await guardarPromedioParcial(inscrito.alumnoRut, codigoRamo);
        if (!resultado.error) {
          exitosos++;
          if (resultado.operacion === "creado") {
            creados++;
          } else if (resultado.operacion === "actualizado") {
            actualizados++;
          }
        } else {
          errores++;
        }
      } catch (error) {
        console.error(`❌ Error calculando promedio parcial para ${inscrito.alumnoRut}:`, error.message);
        errores++;
      }
    }

    return {
      success: true,
      data: {
        exitosos,
        creados,
        actualizados,
        errores,
        total: inscritos.length,
        message: `Promedios parciales: ${creados} creados, ${actualizados} actualizados${errores > 0 ? `, ${errores} con error` : ""}`
      }
    };
  } catch (error) {
    console.error("Error al calcular promedios parciales del ramo:", error);
    return { error: error.message };
  }
}

/**
 * Calcula y guarda promedio FINAL para TODOS los alumnos inscritos en un ramo
 * Usado por el botón "Calcular Promedio Final"
 * Requiere que ya existan promedios parciales guardados
 * 
 * @param {Array} inscritos - Lista de alumnos inscritos con su RUT
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise<Object>} {exitosos, actualizados, errores, total}
 */
export async function calcularPromediosFinalRamo(inscritos, codigoRamo) {
  try {
    let exitosos = 0;
    let actualizados = 0;
    let errores = 0;

    // Calcular promedio final para cada alumno
    for (const inscrito of inscritos) {
      try {
        const resultado = await guardarPromedioFinal(inscrito.alumnoRut, codigoRamo);
        if (!resultado.error) {
          exitosos++;
          if (resultado.operacion === "actualizado") {
            actualizados++;
          }
        } else {
          errores++;
        }
      } catch (error) {
        console.error(`❌ Error calculando promedio final para ${inscrito.alumnoRut}:`, error.message);
        errores++;
      }
    }

    return {
      success: true,
      data: {
        exitosos,
        actualizados,
        errores,
        total: inscritos.length,
        message: `Promedios finales: ${actualizados} actualizados${errores > 0 ? `, ${errores} con error` : ""}`
      }
    };
  } catch (error) {
    console.error("Error al calcular promedios finales del ramo:", error);
    return { error: error.message };
  }
}
