import { BadRequestError, NotFoundError, handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  createRamo,
  getAllRamos,
  getRamoById,
  getRamoByCodigo,
  updateRamo,
  deleteRamo
} from "../services/ramos.service.js";
import { AppDataSource } from "../config/configDb.js";
import { Seccion } from "../entities/seccion.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { User } from "../entities/user.entity.js";

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
    console.error("Error al eliminar ramo: ", error);
    res.status(500).json({ message: "Error al eliminar ramo." });
  }
}

export async function inscribirAlumno(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { rutAlumno, codigoRamo } = req.body;

        if (!rutAlumno || !codigoRamo) {
            return handleErrorClient(res, 400, "Se requiere el RUT del alumno y el código del ramo");
        }

        // Buscar al alumno por su RUT
        const userRepository = AppDataSource.getRepository(User);
        const alumnoRepository = AppDataSource.getRepository(Alumno);

        const userAlumno = await userRepository.findOne({
            where: { rut: rutAlumno, role: "alumno" }
        });

        if (!userAlumno) {
            return handleErrorClient(res, 404, "No se encontró un alumno con el RUT especificado");
        }

        const alumno = await alumnoRepository.findOne({
            where: { id: userAlumno.id },
            relations: ["user"]
        });

        if (!alumno) {
            return handleErrorClient(res, 404, "No se encontró el perfil de alumno");
        }

        // Verificar que el ramo exista
        const ramo = await getRamoByCodigo(codigoRamo);

        // Verificar permisos según el rol
        if (userRole === "profesor") {
            // Si es profesor, verificar que el ramo le pertenezca
            if (ramo.profesor.id !== userId) {
                return handleErrorClient(res, 403, "No tienes permiso para modificar este ramo");
            }
        }
        // Si es admin, tiene permiso automáticamente

        // Si el ramo no tiene secciones, crear una por defecto
        if (!ramo.secciones || ramo.secciones.length === 0) {
            const seccionRepository = AppDataSource.getRepository(Seccion);
            const nuevaSeccion = seccionRepository.create({
                numero: 1,
                ramo: ramo
            });
            await seccionRepository.save(nuevaSeccion);
            ramo.secciones = [nuevaSeccion];
        }

        // Añadir alumno a la primera sección del ramo
        const seccion = ramo.secciones[0];
        if (!seccion.alumnos) {
            seccion.alumnos = [];
        }

        // Verificar si el alumno ya está inscrito
        if (seccion.alumnos.some(a => a.id === alumno.id)) {
            return handleErrorClient(res, 400, "El alumno ya está inscrito en este ramo");
        }

        // Inscribir alumno
        seccion.alumnos.push(alumno);
        await AppDataSource.getRepository(Seccion).save(seccion);

        handleSuccess(res, 200, "Alumno inscrito exitosamente", {
            ramo: ramo.nombre,
            alumno: alumno.user.nombres + " " + alumno.user.apellidoPaterno
        });

    } catch (error) {
        handleErrorServer(res, 500, "Error al inscribir alumno", error.message);
    }
}