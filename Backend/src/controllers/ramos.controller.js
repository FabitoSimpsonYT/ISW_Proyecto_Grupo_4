import { BadRequestError, NotFoundError, handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  createRamo,
  getAllRamos,
  getRamoById,
  getRamoByCodigo,
  updateRamo,
  deleteRamo,
  getRamosByUser
} from "../services/ramos.service.js";
import { AppDataSource } from "../config/configDb.js";
import { Seccion } from "../entities/seccion.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { User } from "../entities/user.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { Ramos } from "../entities/ramos.entity.js";

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
    const { rutProfesor } = req.body;
    if (rutProfesor) {
      const userRepository = AppDataSource.getRepository(User);
      const profesorRepository = AppDataSource.getRepository(Profesor);

      const user = await userRepository.findOne({ where: { rut: rutProfesor, role: "profesor" } });
      if (!user) {
        return handleErrorClient(res, 400, "No se encontró un usuario con ese RUT y role 'profesor'");
      }

      const existingProfesor = await profesorRepository.findOne({ where: { id: user.id } });
      if (!existingProfesor) {
        const profile = profesorRepository.create({
          id: user.id,
          especialidad: req.body.especialidad || null,
          user
        });
        await profesorRepository.save(profile);
      }
    }

    const newRamo = await createRamo(req.body);
    handleSuccess(res, 201, "Ramo creado exitosamente", newRamo);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return handleErrorClient(res, 400, error.message);
    }
    console.error("Error al crear ramo: ", error);
    return handleErrorServer(res, 500, "Error al crear ramo", error.message);
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
    
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const ramos = await getRamosByUser(userId, userRole);
    
    const message = userRole === "alumno" ? "Ramos inscritos encontrados" : "Ramos dictados encontrados";
    

    
    res.status(200).json({
      message: message,
      data: ramos
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      console.error(`❌ [ramos] Known error: ${error.message}`);
      return res.status(404).json({ message: error.message });
    }
    console.error(`❌ [ramos] Error: ${error?.message}`);
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

        const ramo = await getRamoByCodigo(codigoRamo);

        if (userRole === "profesor") {
            if (ramo.profesor.id !== userId) {
                return handleErrorClient(res, 403, "No tienes permiso para modificar este ramo");
            }
        }
        if (!ramo.secciones || ramo.secciones.length === 0) {
            const seccionRepository = AppDataSource.getRepository(Seccion);
            const nuevaSeccion = seccionRepository.create({
                numero: 1,
                ramo: ramo
            });
            await seccionRepository.save(nuevaSeccion);
            ramo.secciones = [nuevaSeccion];
        }

        const seccion = ramo.secciones[0];
        if (!seccion.alumnos) {
            seccion.alumnos = [];
        }

        if (seccion.alumnos.some(a => a.id === alumno.id)) {
            return handleErrorClient(res, 400, "El alumno ya está inscrito en este ramo");
        }

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

export async function createSeccionHandler(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { codigoRamo, numero, alumnosRut } = req.body;

    if (!codigoRamo || !numero) {
      return handleErrorClient(res, 400, "Se requiere codigoRamo y numero para crear la sección");
    }

    const ramosRepository = AppDataSource.getRepository(Ramos);
    const ramo = await ramosRepository.findOne({ where: { codigo: codigoRamo }, relations: ["profesor", "secciones", "secciones.alumnos"] });

    if (!ramo) {
      return handleErrorClient(res, 404, `No se encontró ramo con código: ${codigoRamo}`);
    }

    if (userRole === "profesor" && (!ramo.profesor || String(ramo.profesor.id) !== String(userId))) {
      return handleErrorClient(res, 403, "No tienes permiso para crear secciones en este ramo");
    }

    const seccionRepository = AppDataSource.getRepository(Seccion);
    const nuevaSeccion = seccionRepository.create({ numero, ramo: ramo });

    if (Array.isArray(alumnosRut) && alumnosRut.length > 0) {
      const userRepo = AppDataSource.getRepository(User);
      const alumnoRepo = AppDataSource.getRepository(Alumno);

      nuevaSeccion.alumnos = [];
      for (const rut of alumnosRut) {
        const userAlumno = await userRepo.findOne({ where: { rut, role: "alumno" } });
        if (!userAlumno) {
          return handleErrorClient(res, 404, `No se encontró alumno con RUT: ${rut}`);
        }
        const alumno = await alumnoRepo.findOne({ where: { id: userAlumno.id }, relations: ["user"] });
        if (!alumno) {
          return handleErrorClient(res, 404, `Perfil de alumno no encontrado para RUT: ${rut}`);
        }
        if (!nuevaSeccion.alumnos.some(a => a.id === alumno.id)) {
          nuevaSeccion.alumnos.push(alumno);
        }
      }
    }

    await seccionRepository.save(nuevaSeccion);

    handleSuccess(res, 201, "Sección creada exitosamente", { seccion: { numero: nuevaSeccion.numero, id: nuevaSeccion.id } });
  } catch (error) {
    console.error("Error al crear sección:", error);
    handleErrorServer(res, 500, "Error al crear sección", error.message);
  }
}
