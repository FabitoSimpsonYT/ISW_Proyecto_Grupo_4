import { AppDataSource } from "../config/configDb.js";
import { Apelacion } from "../entities/apelacion.entity.js";
import { User } from "../entities/user.entity.js";


export const createApelacion = async (req, res) => {
  try {
    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const userRepo = AppDataSource.getRepository(User);

    const { tipo, mensaje, profesorCorreo } = req.body;
    const alumnoId = req.user?.id || req.user?.sub;

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

    const apelacion = apelacionRepo.create({
      tipo,
      mensaje,
      estado: "pendiente",
      puedeEditar: true,
      alumno,
      profesor,
    });

    
    await apelacionRepo.save(apelacion);

    const ahora = new Date();
    let puedeEditar = apelacion.puedeEditar;

    if (apelacion.fechaLimiteEdicion) {
      const horasRestantes = (apelacion.fechaLimiteEdicion - ahora) / (1000 * 60 * 60);
      puedeEditar = horasRestantes >= 24;
    }

    const apelacionLimpia = {
      tipo: apelacion.tipo,
      mensaje: apelacion.mensaje,
      estado: apelacion.estado,
      respuestaDocente: apelacion.respuestaDocente || null,
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
        tipo: a.tipo,
        mensaje: a.mensaje,
        estado: a.estado,
        respuestaDocente: a.respuestaDocente,
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
      estado: a.estado,
      respuestaDocente: a.respuestaDocente,
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


export const updateEstadoApelacion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado, respuestaDocente, fechaLimiteEdicion } = req.body;

    if (!["aceptada", "rechazada"].includes(estado)) {
      return res.status(400).json({ message: "Estado inválido. Debe ser 'aceptada' o 'rechazada'." });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["profesor", "alumno"],
    });

    if (!apelacion) {
      return res.status(404).json({ message: "Apelación no encontrada." });
    }

    const profesorId = req.user?.id || req.user?.sub;
    if (!profesorId) {
      return res.status(401).json({ message: "Token inválido o sin identificador de usuario." });
    }

    if (apelacion.profesor?.id !== profesorId) {
      return res.status(403).json({ message: "No tienes permiso para actualizar esta apelación." });
    }

    if (apelacion.estado === "rechazada" && estado === "rechazada") {
      return res.status(400).json({ message: "La apelación ya fue rechazada y no puede modificarse nuevamente." });
    }

    if (estado === "aceptada") {
      if (!respuestaDocente?.trim()) {
        return res.status(400).json({ message: "Debes incluir una respuesta del profesor al aceptar la apelación." });
      }

      apelacion.estado = "aceptada";
      apelacion.respuestaDocente = respuestaDocente.trim();

      const fechaValida = fechaLimiteEdicion ? new Date(fechaLimiteEdicion) : null;
      apelacion.fechaLimiteEdicion = isNaN(fechaValida?.getTime()) ? null : fechaValida;

      if (apelacion.fechaLimiteEdicion) {
        const horasRestantes = (apelacion.fechaLimiteEdicion - new Date()) / (1000 * 60 * 60);
        apelacion.puedeEditar = horasRestantes >= 24;
      } else {
        apelacion.puedeEditar = false;
      }
    }

    if (estado === "rechazada") {
      apelacion.estado = "rechazada";
      apelacion.respuestaDocente = null;
      apelacion.fechaLimiteEdicion = null;
      apelacion.puedeEditar = false;
    }

    await apelacionRepo.save(apelacion);

    return res.status(200).json({
      message: "Apelación actualizada correctamente",
      data: apelacion,
    });
  } catch (err) {
    console.error("Error al actualizar apelación:", err);
    res.status(500).json({ message: "Error al actualizar la apelación" });
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
