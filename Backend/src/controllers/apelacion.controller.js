import { arch } from "os";
import { AppDataSource } from "../config/configDb.js";
import { Apelacion } from "../entities/apelacion.entity.js";
import { User } from "../entities/user.entity.js";
import path from "path";
import { fileURLToPath } from "url";
import { renameUploadedFile } from "../services/archivo.service.js";
import fs from "fs";



export const createApelacion = async (req, res) => {
  try {

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const userRepo = AppDataSource.getRepository(User);

    const { tipo, mensaje, profesorCorreo } = req.body;
    const alumnoId = req.user?.id || req.user?.sub;
    const file = req.file; 

    if (!alumnoId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const alumno = await userRepo.findOneBy({ id: alumnoId });
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    if (!profesorCorreo) {
      return res.status(400).json({ message: "Debe indicar el correo del profesor" });
    }

    const profesor = await userRepo.findOne({
      where: { email: profesorCorreo, role: "profesor" },
    });

    if (!profesor) {
      return res.status(400).json({ message: "Profesor no válido o no encontrado" });
    }

    let archivo = null;

    if (req.file) {
      archivo = renameUploadedFile(
        req.file,              
        `AP-${alumnoId}`,        
        Date.now()              
      );
    }

    const apelacion = apelacionRepo.create({
      tipo,
      mensaje,
      estado: "pendiente",
      puedeEditar: true,
      archivo: file ? file.filename : null,        
      alumno,
      profesor,
    });

    await apelacionRepo.save(apelacion);

    const ahora = new Date();
    let puedeEditar = apelacion.puedeEditar;

    if (apelacion.fechaLimiteEdicion) {
      const horasRestantes =
        (apelacion.fechaLimiteEdicion - ahora) / (1000 * 60 * 60);
      puedeEditar = horasRestantes >= 24;
    }

    const apelacionLimpia = {
      tipo: apelacion.tipo,
      mensaje: apelacion.mensaje,
      estado: apelacion.estado,
      archivo: apelacion.archivo,
      respuestaDocente: apelacion.respuestaDocente || null,
      fechaCitacion: apelacion.fechaCitacion || null,
      fechaCreacion: apelacion.fechaCreacion,
      fechaLimiteEdicion: apelacion.fechaLimiteEdicion,
      puedeEditar,
      profesor: {
        nombre: profesor.nombre,
        email: profesor.email,
      },
    };

    return res.status(201).json({
      message: "Apelación creada correctamente",
      data: apelacionLimpia,
    });

  } catch (error) {
    console.error("Error al crear apelación:", error);
    res.status(500).json({ message: "Error interno al crear apelación" });
  }
};





export const subirArchivo = async (req, res) => {
  try {
    const idApelacion = req.params.id;

    if (!req.file) {
      return res.status(400).json({ mensaje: "No se envió archivo" });
    }

    const rutaArchivo = req.file.filename; 

    const repo = AppDataSource.getRepository(Apelacion);

    const apelacion = await repo.findOneBy({ id: idApelacion });
    if (!apelacion) return res.status(404).json({ mensaje: "Apelación no encontrada" });

    apelacion.archivo = rutaArchivo;
    await repo.save(apelacion);

    res.json({
      mensaje: "Archivo subido correctamente",
      archivo: rutaArchivo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al subir archivo" });
  }
};



export const descargarArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Apelacion);

    const apelacion = await repo.findOneBy({ id });

    if (!apelacion || !apelacion.archivo) {
      return res.status(404).json({ mensaje: "Archivo no encontrado" });
    }

    // Ruta correcta
    const uploadsDir = path.resolve("src/uploads");
    const filePath = path.join(uploadsDir, apelacion.archivo);

    // Verificación física del archivo
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ mensaje: "El archivo no existe en el servidor" });
    }

    return res.download(filePath, apelacion.archivo);
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    return res.status(500).json({ mensaje: "Error al descargar archivo" });
  }
};






export const getMisApelaciones = async (req, res) => {
  try {
    const alumnoId = req.user.id;
    const apelacionRepo = AppDataSource.getRepository(Apelacion);

    const apelaciones = await apelacionRepo.find({
      where: { alumno: { id: alumnoId } },
      relations: ["profesor", "alumno"],
      order: { id: "DESC" },
    });

    const ahora = new Date();
    const apelacionesLimpias = apelaciones.map((a) => {
      let puedeEditar = a.puedeEditar;
      if (a.fechaLimiteEdicion) {
        const horasRestantes = (a.fechaLimiteEdicion - ahora) / (1000 * 60 * 60);
        puedeEditar = horasRestantes >= 24;
      }

      return {
        id: a.id,
        tipo: a.tipo,
        mensaje: a.mensaje,
        archivo: a.archivo,
        estado: a.estado,
        respuestaDocente: a.respuestaDocente,
        fechaCitacion: a.fechaCitacion,
        fechaCreacion: a.fechaCreacion,
        fechaLimiteEdicion: a.fechaLimiteEdicion,
        puedeEditar,
        profesor: a.profesor
          ? {
              nombre: a.profesor.nombre,
              email: a.profesor.email,
            }
          : null,
      };
    });

    res.status(200).json({
      message: "Apelaciones encontradas",
      data: apelacionesLimpias,
    });
  } catch (err) {
    console.error("Error al obtener apelaciones:", err);
    res.status(500).json({ message: "Error al obtener apelaciones" });
  }
};




export const getApelacionPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido." });

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["profesor", "alumno"],
    });

    if (!apelacion) return res.status(404).json({ message: "Apelación no encontrada." });

    const user = req.user;
    if (user.role === "alumno" && apelacion.alumno.id !== user.id) {
      return res.status(403).json({ message: "No tienes permiso para ver esta apelación." });
    }
    if (user.role === "profesor" && apelacion.profesor?.id !== user.id) {
      return res.status(403).json({ message: "No tienes permiso para ver esta apelación." });
    }


    if (apelacion.fechaLimiteEdicion) {
      const horasRestantes = (apelacion.fechaLimiteEdicion - new Date()) / (1000 * 60 * 60);
      apelacion.puedeEditar = horasRestantes >= 24;
    }

    res.status(200).json({ message: "Apelación encontrada", data: apelacion });
  } catch (err) {
    console.error("Error al obtener apelación:", err);
    res.status(500).json({ message: "Error al obtener la apelación" });
  }
};




export const getApelacionesDelProfesor = async (req, res) => {
  try {
    const profesorId = req.user?.id || req.user?.sub;

    if (!profesorId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);

    const apelaciones = await apelacionRepo.find({
      where: { profesor: { id: profesorId } },
      relations: ["profesor", "alumno"],
      order: { createdAt: "DESC" },
    });

    if (!apelaciones.length) {
      return res.status(200).json({
        message: "No tienes apelaciones asignadas.",
        data: [],
      });
    }

    const data = apelaciones.map(a => ({
      id: a.id,
      tipo: a.tipo,
      mensaje: a.mensaje,
      archivo: a.archivo,
      estado: a.estado,
      respuestaDocente: a.respuestaDocente,
      fechaCitacion: a.fechaCitacion,
      puedeEditar: a.puedeEditar,
      fechaLimiteEdicion: a.fechaLimiteEdicion,
      creadoEl: a.createdAt,
      actualizadoEl: a.updatedAt,
      alumno: a.alumno ? {
        id: a.alumno.id,
        nombre: `${a.alumno.nombres} ${a.alumno.apellidoPaterno} ${a.alumno.apellidoMaterno}`,
        email: a.alumno.email,
        telefono: a.alumno.telefono,
      } : null,
    }));

    res.status(200).json({
      message: "Apelaciones del profesor obtenidas correctamente",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Error al obtener apelaciones del profesor:", error);
    res.status(500).json({ message: "Error interno al obtener apelaciones del profesor" });
  }
};



export const editarApelacionAlumno = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { mensaje, profesorEmail, removeArchivo } = req.body;
    const nuevoArchivo = req.file?.filename;

    if (!mensaje && !nuevoArchivo && !profesorEmail && removeArchivo !== "true") {
      return res.status(400).json({
        message: "Debe enviar al menos un campo para editar.",
      });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const userRepo = AppDataSource.getRepository(User);

    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["alumno", "profesor"],
    });

    if (!apelacion) {
      return res.status(404).json({ message: "Apelación no encontrada." });
    }

    const alumnoId = req.user?.id || req.user?.sub;
    if (apelacion.alumno.id !== alumnoId) {
      return res.status(403).json({ message: "No autorizado." });
    }

    if (apelacion.fechaLimiteEdicion) {
  const ahora = new Date();

  if (ahora > apelacion.fechaLimiteEdicion) {
    apelacion.puedeEditar = false;
    await apelacionRepo.save(apelacion);

    return res.status(403).json({
      message: "El plazo para editar esta apelación ya expiró.",
    });
  }
}

    if (!["pendiente", "cita", "revisada"].includes(apelacion.estado)) {
      return res.status(400).json({
        message: "La apelación no se puede editar en este estado.",
      });
    }

    if (!apelacion.puedeEditar) {
      return res.status(400).json({
        message: "La apelación ya no se puede editar.",
      });
    }

    if (mensaje?.trim()) {
      apelacion.mensaje = mensaje.trim();
    }

    const uploadsDir = path.resolve("src/uploads");

    if (removeArchivo === "true" && apelacion.archivo) {
      const oldPath = path.join(uploadsDir, apelacion.archivo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      apelacion.archivo = null;
    }

    if (nuevoArchivo) {
      if (apelacion.archivo) {
        const oldPath = path.join(uploadsDir, apelacion.archivo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      apelacion.archivo = nuevoArchivo;
    }

    if (profesorEmail) {
      const nuevoProfesor = await userRepo.findOne({
        where: { email: profesorEmail, role: "profesor" },
      });

      if (!nuevoProfesor) {
        return res.status(404).json({ message: "Profesor no encontrado." });
      }

      apelacion.profesor = nuevoProfesor;
    }

    await apelacionRepo.save(apelacion);

    return res.status(200).json({
      message: "Apelación editada correctamente",
      data: apelacion,
    });

  } catch (error) {
    console.error("Error al editar apelación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};







export const updateEstadoApelacion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const { estado, respuestaDocente, fechaCitacion } = req.body;

    const estadosValidos = ["revisada", "aceptada", "rechazada", "cita"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["profesor"],
    });

    if (!apelacion) {
      return res.status(404).json({ message: "Apelación no encontrada." });
    }

    const profesorId = req.user?.id || req.user?.sub;
    if (!profesorId || apelacion.profesor.id !== profesorId) {
      return res.status(403).json({ message: "No autorizado." });
    }

    if (["aceptada", "rechazada"].includes(apelacion.estado)) {
      return res.status(400).json({
        message: "La apelación ya fue resuelta y no puede modificarse.",
      });
    }

    if (estado === "revisada") {
      if (apelacion.estado !== "pendiente") {
        return res.status(400).json({
          message: "Solo se puede revisar una apelación pendiente.",
        });
      }

      apelacion.estado = "revisada";
      await apelacionRepo.save(apelacion);

      return res.status(200).json({
        message: "Apelación marcada como revisada.",
        data: apelacion,
      });
    }

    if (estado === "rechazada") {
      if (!respuestaDocente?.trim()) {
        return res.status(400).json({
          message: "El rechazo requiere un mensaje obligatorio.",
        });
      }

      apelacion.estado = "rechazada";
      apelacion.respuestaDocente = respuestaDocente.trim();
      apelacion.fechaCitacion = null;
      apelacion.fechaLimiteEdicion = null;
      apelacion.puedeEditar = false;
    }

    if (estado === "aceptada") {
      apelacion.estado = "aceptada";
      apelacion.respuestaDocente = respuestaDocente?.trim() || null;
      apelacion.fechaCitacion = null;
      apelacion.fechaLimiteEdicion = null;
      apelacion.puedeEditar = false;
    }

if (estado === "cita") {
  if (!fechaCitacion && apelacion.fechaCitacion) {
    apelacion.estado = "cita";
    apelacion.respuestaDocente = respuestaDocente?.trim() || null;
    apelacion.puedeEditar = true;

  }

  else {
    if (!fechaCitacion) {
      return res.status(400).json({
        message: "La citación requiere una fecha de citación válida.",
      });
    }

    const fechaCita = new Date(fechaCitacion);
    if (isNaN(fechaCita.getTime())) {
      return res.status(400).json({
        message: "La fecha de citación no es válida.",
      });
    }

    apelacion.estado = "cita";
    apelacion.respuestaDocente = respuestaDocente?.trim() || null;
    apelacion.fechaCitacion = fechaCita;

    const limite = new Date(fechaCita);
    limite.setHours(limite.getHours() - 24);

    apelacion.fechaLimiteEdicion = limite;
    apelacion.puedeEditar = true;
  }
}
    await apelacionRepo.save(apelacion);

    return res.status(200).json({
      message: "Estado actualizado correctamente",
      data: apelacion,
    });

  } catch (error) {
    console.error("Error al actualizar apelación:", error);
    return res.status(500).json({ message: "Error interno" });
  }
};





export const getAllApelaciones = async (req, res) => {
  try {
    const apelacionRepo = AppDataSource.getRepository(Apelacion);

    const apelaciones = await apelacionRepo.find({
      relations: ["profesor", "alumno"],
      order: { createdAt: "DESC" },
    });

    const data = apelaciones.map(a => ({
      id: a.id,
      tipo: a.tipo,
      mensaje: a.mensaje,
      estado: a.estado,
      respuestaDocente: a.respuestaDocente,
      puedeEditar: a.puedeEditar,
      fechaLimiteEdicion: a.fechaLimiteEdicion,
      creadoEl: a.createdAt,
      actualizadoEl: a.updatedAt,
      profesor: a.profesor ? {
        id: a.profesor.id,
        nombre: `${a.profesor.nombres} ${a.profesor.apellidoPaterno} ${a.profesor.apellidoMaterno}`,
        email: a.profesor.email,
        telefono: a.profesor.telefono,
      } : null,
      alumno: a.alumno ? {
        id: a.alumno.id,
        nombre: `${a.alumno.nombres} ${a.alumno.apellidoPaterno} ${a.alumno.apellidoMaterno}`,
        email: a.alumno.email,
        telefono: a.alumno.telefono,
      } : null,
    }));

    res.status(200).json({
      message: "Listado de apelaciones obtenido correctamente",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Error al obtener apelaciones:", error);
    res.status(500).json({ message: "Error interno al obtener apelaciones" });
  }
};



export const deleteApelacion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);

    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["alumno"],
    });

    if (!apelacion) {
      return res.status(404).json({ message: "Apelación no encontrada." });
    }

    // 🔒 VALIDACIÓN DE NEGOCIO
    if (apelacion.estado !== "pendiente") {
      return res.status(403).json({
        message: "Solo se pueden eliminar apelaciones en estado pendiente.",
      });
    }

    await apelacionRepo.remove(apelacion);

    return res.status(200).json({
      message: "Apelación eliminada correctamente.",
      data: { id },
    });
  } catch (error) {
    console.error("Error al eliminar apelación:", error);
    res.status(500).json({ message: "Error interno al eliminar apelación" });
  }
};



export async function getApelacionesPorEstado(req, res) {
  try {
    const { estado } = req.params;

    const estadosValidos = [
      "pendiente",
      "revisada",
      "aceptada",
      "rechazada",
      "cita",
    ];

    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado inválido o no enviado",
      });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);

    const apelaciones = await apelacionRepo.find({
      where: { estado },
      relations: ["alumno", "profesor"],
      order: { createdAt: "DESC" },
    });

    const apelacionesFiltradas = apelaciones.map((apelacion) => {
      const { alumno, profesor, ...resto } = apelacion;

      return {
        ...resto,
        alumno: alumno
          ? {
              id: alumno.id,
              nombres: alumno.nombres,
              apellidoPaterno: alumno.apellidoPaterno,
              apellidoMaterno: alumno.apellidoMaterno,
              email: alumno.email,
            }
          : null,
        profesor: profesor
          ? {
              id: profesor.id,
              nombres: profesor.nombres,
              apellidoPaterno: profesor.apellidoPaterno,
              apellidoMaterno: profesor.apellidoMaterno,
              email: profesor.email,
            }
          : null,
      };
    });

    return res.status(200).json({
      message: `Apelaciones con estado "${estado}" encontradas`,
      data: apelacionesFiltradas,
    });

  } catch (error) {
    console.error("Error al obtener apelaciones por estado:", error);
    return res.status(500).json({
      message: "Error al obtener apelaciones por estado",
    });
  }
}

