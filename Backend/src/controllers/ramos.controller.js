// Buscar alumnos por query (nombre, apellido o rut)
import { buscarAlumnosPorQuery } from "../services/ramos.service.js";
import { Seccion } from "../entities/seccion.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function buscarAlumnosHandler(req, res) {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Debe proporcionar un parámetro de búsqueda (query)" });
    }
    const alumnos = await buscarAlumnosPorQuery(query);
    res.status(200).json({
      message: "Alumnos encontrados",
      data: alumnos
    });
  } catch (error) {
    console.error("Error al buscar alumnos:", error);
    res.status(500).json({ message: "Error al buscar alumnos" });
  }
}
import { BadRequestError, NotFoundError, handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  createRamo,
  getAllRamos,
  getRamoById,
  getRamoByCodigo,
  updateRamo,
  deleteRamo,
  getRamosByUser,
  inscribirAlumnoEnRamo,
  createSeccion,
  getSeccionesByRamo,
  deleteSeccion
} from "../services/ramos.service.js";

export async function getAllRamosHandler(req, res) {
  try {
    const ramos = await getAllRamos();
    res.status(200).json({
      message: "Ramos encontrados",
      data: ramos
    });
  } catch (error) {
    console.error("Error en ramos.controller.js -> getAllRamosHandler(): ", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function getRamoByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const ramo = await getRamoById(id);
    res.status(200).json({
      message: "Ramo encontrado",
      data: ramo
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error al obtener ramo", error);
    res.status(500).json({ message: "Error al obtener ramo." });
  }
}

export async function getRamoByCodigoHandler(req, res) {
  try {
    const { codigo } = req.params;
    const ramo = await getRamoByCodigo(codigo);
    res.status(200).json({
      message: "Ramo encontrado",
      data: ramo
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error al obtener ramo", error);
    res.status(500).json({ message: "Error al obtener ramo." });
  }
}

export async function createRamoHandler(req, res) {
  try {
    const newRamo = await createRamo(req.body);
    res.status(201).json({
      message: "Ramo creado exitosamente",
      data: newRamo
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error al crear ramo: ", error);
    res.status(500).json({ message: "Error al crear ramo." });
  }
}

export async function updateRamoHandler(req, res) {
  try {
    const { codigo } = req.params;
    const updatedRamo = await updateRamo(codigo, req.body);
    res.status(200).json({
      message: "Ramo actualizado correctamente",
      data: updatedRamo
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    if (error instanceof BadRequestError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error al actualizar ramo: ", error);
    res.status(500).json({ message: "Error al actualizar ramo." });
  }
}

export async function getMisRamosHandler(req, res) {
  try {
    // El ID y rol del usuario vienen del token JWT que fue decodificado en el middleware
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const ramos = await getRamosByUser(userId, userRole);
    
    const message = userRole === "alumno" ? "Ramos inscritos encontrados" : "Ramos dictados encontrados";
    
    res.status(200).json({
      message: message,
      data: ramos
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error al obtener ramos: ", error);
    res.status(500).json({ message: "Error al obtener ramos." });
  }
}

export async function deleteRamoHandler(req, res) {
  try {
    const { codigo } = req.params;
    await deleteRamo(codigo);
    res.status(200).json({ message: "Ramo eliminado exitosamente" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    // Verificar si es error de llave foránea (violación de integridad)
    if (error.code === '23503' || error.driverError?.code === '23503') {
      return res.status(409).json({ 
        message: "No se puede eliminar el ramo porque tiene evaluaciones asociadas. Elimina las evaluaciones primero." 
      });
    }
    console.error("Error al eliminar ramo: ", error);
    res.status(500).json({ message: "Error al eliminar ramo." });
  }
}

export async function inscribirAlumno(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { codigoRamo, seccionId } = req.params;
        const { rutAlumno } = req.body;

        if (!rutAlumno) {
            return handleErrorClient(res, 400, "Se requiere el RUT del alumno");
        }

        const result = await inscribirAlumnoEnRamo(rutAlumno, parseInt(seccionId), codigoRamo, userId, userRole);
        handleSuccess(res, 200, "Alumno inscrito exitosamente", result);

    } catch (error) {
        if (error instanceof BadRequestError) {
            return handleErrorClient(res, 400, error.message);
        }
        if (error instanceof NotFoundError) {
            return handleErrorClient(res, 404, error.message);
        }
        handleErrorServer(res, 500, "Error al inscribir alumno", error.message);
    }
}

export async function createSeccionHandler(req, res) {
  try {
    // Tomar el código de ramo desde los params
    const { codigoRamo } = req.params;
    const newSeccion = await createSeccion({ ...req.body, codigoRamo });
    res.status(201).json({
      message: "Sección creada exitosamente",
      data: newSeccion
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return handleErrorClient(res, 400, error.message);
    }
    if (error instanceof NotFoundError) {
      return handleErrorClient(res, 404, error.message);
    }
    console.error("Error al crear sección: ", error);
    handleErrorServer(res, 500, "Error al crear sección", error.message);
  }
}

export async function getSeccionesByRamoHandler(req, res) {
    try {
        const { codigo } = req.params;
        const secciones = await getSeccionesByRamo(codigo);
        res.status(200).json({
            message: "Secciones encontradas",
            data: secciones
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return handleErrorClient(res, 404, error.message);
        }
        console.error("Error al obtener secciones: ", error);
        handleErrorServer(res, 500, "Error al obtener secciones", error.message);
    }
}

export async function deleteSeccionHandler(req, res) {
    try {
        const { codigoRamo, seccionId } = req.params;
        await deleteSeccion(parseInt(seccionId), codigoRamo);
        res.status(200).json({
            message: "Sección eliminada exitosamente"
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return handleErrorClient(res, 404, error.message);
        }
        console.error("Error al eliminar sección: ", error);
        handleErrorServer(res, 500, "Error al eliminar sección", error.message);
    }
}



// Obtener alumnos inscritos en una sección
export async function getAlumnosBySeccion(req, res) {
  try {
    const { codigoRamo, numero } = req.params;
    const seccionRepository = AppDataSource.getRepository(Seccion);
    const seccion = await seccionRepository.findOne({
      where: {
        ramo: { codigo: codigoRamo },
        numero: parseInt(numero)
      },
      relations: ['alumnos', 'alumnos.user', 'ramo']
    });
    if (!seccion) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    const alumnos = seccion.alumnos.map(a => ({
      id: a.id,
      rut: a.user.rut,
      nombres: a.user.nombres,
      apellidoPaterno: a.user.apellidoPaterno,
      apellidoMaterno: a.user.apellidoMaterno
    }));
    return res.status(200).json({ message: 'Alumnos inscritos encontrados', data: alumnos });
  } catch (error) {
    console.error('Error al obtener alumnos inscritos:', error);
    return res.status(500).json({ message: 'Error al obtener alumnos inscritos', error: error.message });
  }
}

