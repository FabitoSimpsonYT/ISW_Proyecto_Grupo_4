
import { AppDataSource } from "../config/configDB.js";
import { Apelacion } from "../entities/apelacion.entity.js";
import { User } from "../entities/user.entity.js";
import path from "path";
import { renameUploadedFile } from "../services/archivo.service.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import fs from "fs";



export const createApelacion = async (req, res) => {
  try {

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const userRepo = AppDataSource.getRepository(User);

    const { tipo, mensaje, profesorCorreo, pautaEvaluadaId, subtipoInasistencia, evaluacionProximaId } = req.body;
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

    if (tipo === "evaluacion") {
      if (!pautaEvaluadaId) {
        return res.status(400).json({
          message: "Debe seleccionar una evaluación para apelar",
        });
      }
    }
    
    if (tipo === "inasistencia" && subtipoInasistencia === "evaluacion") {
      if (!evaluacionProximaId) {
        return res.status(400).json({
          message: "Debe seleccionar una evaluación próxima",
        });
      }
    }
    
    const pautaRepo = AppDataSource.getRepository(PautaEvaluada);
    let pauta = null;

    if (tipo === "evaluacion") {
      pauta = await pautaRepo.findOne({
        where: { 
          id: pautaEvaluadaId, 
          alumno: { id: alumnoId } 
        },
      });

      if (!pauta || pauta.notaFinal === null) {
        return res.status(400).json({
          message: "No existe una nota válida para apelar",
        });
      }
    }

    let archivo = null;

    if (req.file) {
      archivo = renameUploadedFile(
        req.file,
        `AP-${alumnoId}`,
        Date.now()
      );
      console.log("createApelacion: req.file:", {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        destination: req.file.destination,
      });
      console.log("createApelacion: archivo renombrado a:", archivo);
    }

    const apelacion = apelacionRepo.create({
      tipo,
      subtipoInasistencia: tipo === "inasistencia" ? subtipoInasistencia : null,
      mensaje,
      estado: "pendiente",
      puedeEditar: true,
      archivo: archivo,
      alumno,
      profesor,
      pautaEvaluada: tipo === "evaluacion" ? pauta : null,
      evaluacionProximaId: tipo === "inasistencia" && subtipoInasistencia === "evaluacion" ? evaluacionProximaId : null,
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
      pautaEvaluada: apelacion.tipo === "evaluacion" && apelacion.pautaEvaluada
        ? {
            id: apelacion.pautaEvaluada.id,
            notaFinal: apelacion.pautaEvaluada.notaFinal,
          }
        : null,
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

        if (apelacion.tipo === "evaluacion") {
      return res.status(400).json({
        mensaje: "No se permite subir archivos en apelaciones por evaluación",
      });
    }

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
      console.error(`Descargar: apelacion o archivo ausente. id=${id} apelacion=`, apelacion);
      return res.status(404).json({ mensaje: "Archivo no encontrado" });
    }

    const uploadsDir = path.resolve("src/uploads");
    const filePath = path.join(uploadsDir, apelacion.archivo);

    if (!fs.existsSync(filePath)) {
      console.error(`Descargar: archivo esperado en disk: ${filePath} no existe.`);
      try {
        const files = fs.readdirSync(uploadsDir);
        console.error("Contenido de src/uploads:", files);
      } catch (e) {
        console.error("No se pudo listar uploads:", e.message);
      }
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
      relations: ["profesor", "alumno", "pautaEvaluada"],
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

        pautaEvaluada: a.tipo === "evaluacion" && a.pautaEvaluada
          ? {
              id: a.pautaEvaluada.id,
              notaFinal: a.pautaEvaluada.notaFinal,
            }
          : null,
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
      relations: ["profesor", "alumno", "pautaEvaluada", "pautaEvaluada.evaluacion"],
    });

    if (!apelacion) return res.status(404).json({ message: "Apelación no encontrada." });

    const user = req.user;
    const userRole = user?.role;
    
    // Validar permisos
    if (userRole === "alumno" && apelacion.alumno.id !== user.id) {
      return res.status(403).json({ message: "No tienes permiso para ver esta apelación." });
    }
    if (userRole === "profesor" && apelacion.profesor?.id !== user.id) {
      return res.status(403).json({ message: "No tienes permiso para ver esta apelación." });
    }
    // Jefe de carrera puede ver todas las apelaciones


    if (apelacion.fechaLimiteEdicion) {
      const horasRestantes = (apelacion.fechaLimiteEdicion - new Date()) / (1000 * 60 * 60);
      apelacion.puedeEditar = horasRestantes >= 24;
    }

    // Enriquecer la respuesta con el título de la evaluación
    const data = {
      ...apelacion,
      pautaEvaluada: apelacion.pautaEvaluada ? {
        ...apelacion.pautaEvaluada,
        evaluacionTitulo: apelacion.pautaEvaluada.evaluacion?.titulo || null,
      } : null,
    };

    res.status(200).json({ message: "Apelación encontrada", data });
  } catch (err) {
    console.error("Error al obtener apelación:", err);
    res.status(500).json({ message: "Error al obtener la apelación" });
  }
};




export const getApelacionesDelProfesor = async (req, res) => {
  try {
    const profesorId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;

    if (!profesorId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const alumnoRepo = AppDataSource.getRepository("Alumno");

    let apelaciones;

    // Si es jefe de carrera, puede ver todas las apelaciones
    if (userRole === "jefecarrera") {
      apelaciones = await apelacionRepo.find({
        relations: ["profesor", "alumno", "pautaEvaluada", "pautaEvaluada.evaluacion"],
        order: { createdAt: "DESC" },
      });
    } else {
      // Si es profesor normal, solo ve sus apelaciones
      apelaciones = await apelacionRepo.find({
        where: { profesor: { id: profesorId } },
        relations: ["profesor", "alumno", "pautaEvaluada", "pautaEvaluada.evaluacion"],
        order: { createdAt: "DESC" },
      });
    }

    if (!apelaciones.length) {
      return res.status(200).json({
        message: "No tienes apelaciones asignadas.",
        data: [],
      });
    }

    const data = await Promise.all(apelaciones.map(async (a) => {
      // Obtener información del ramo del alumno
      let ramoInfo = null;
      if (a.alumno) {
        const alumno = await alumnoRepo.findOne({
          where: { id: a.alumno.id },
          relations: ["secciones", "secciones.ramo"],
        });
        
        // Buscar el ramo correspondiente según el tipo de apelación
        if (alumno && alumno.secciones && alumno.secciones.length > 0) {
          if (a.pautaEvaluada && a.pautaEvaluada.codigoRamo) {
            const seccionConRamo = alumno.secciones.find(s => s.ramo?.codigo === a.pautaEvaluada.codigoRamo);
            if (seccionConRamo && seccionConRamo.ramo) {
              ramoInfo = {
                codigo: seccionConRamo.ramo.codigo,
                nombre: seccionConRamo.ramo.nombre,
              };
            }
          } else if (alumno.secciones.length > 0 && alumno.secciones[0].ramo) {
            // Si no hay información del ramo en la pauta, usar el primer ramo inscrito
            ramoInfo = {
              codigo: alumno.secciones[0].ramo.codigo,
              nombre: alumno.secciones[0].ramo.nombre,
            };
          }
        }
      }

      return {
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
        pautaEvaluada:a.pautaEvaluada ? {
          id: a.pautaEvaluada.id,
          notaFinal: a.pautaEvaluada.notaFinal,
          codigoRamo: a.pautaEvaluada.codigoRamo,
          evaluacionTitulo: a.pautaEvaluada.evaluacion?.titulo || null,
        }
      : null,
        alumno: a.alumno ? {
          id: a.alumno.id,
          nombre: `${a.alumno.nombres} ${a.alumno.apellidoPaterno} ${a.alumno.apellidoMaterno}`,
          email: a.alumno.email,
          telefono: a.alumno.telefono,
          ramo: ramoInfo,
        } : null,
      };
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
    const { mensaje, profesorCorreo, removeArchivo, pautaEvaluadaId } = req.body;
    const nuevoArchivo = req.file?.filename;

    if (!mensaje && !nuevoArchivo && !profesorCorreo && removeArchivo !== "true" && pautaEvaluadaId === undefined) {
      return res.status(400).json({
        message: "Debe enviar al menos un campo para editar.",
      });
    }

    const apelacionRepo = AppDataSource.getRepository(Apelacion);
    const userRepo = AppDataSource.getRepository(User);

    const apelacion = await apelacionRepo.findOne({
      where: { id },
      relations: ["alumno", "profesor", "pautaEvaluada"],
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

    if (pautaEvaluadaId !== undefined) {
      if (apelacion.tipo !== "evaluacion") {
        return res.status(400).json({
          message: "Esta apelación no es por evaluación.",
        });
      }

      const pautaRepo = AppDataSource.getRepository(PautaEvaluada);

      const nuevaPauta = await pautaRepo.findOne({
        where: {
          id: pautaEvaluadaId,
          alumno: { id: apelacion.alumno.id },
        },
      });

      if (!nuevaPauta || nuevaPauta.notaFinal === null) {
        return res.status(400).json({
          message: "La pauta seleccionada no es válida para apelar.",
        });
      }

      apelacion.pautaEvaluada = nuevaPauta;
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

    // Primero manejar la eliminación si se solicita
    if (removeArchivo === "true" && apelacion.archivo) {
      const oldPath = path.join(uploadsDir, apelacion.archivo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      apelacion.archivo = null;
    }

    // Luego manejar el nuevo archivo si existe
    if (nuevoArchivo) {
      console.log("editarApelacionAlumno: nuevoArchivo filename (multer):", nuevoArchivo);
      // Si hay un archivo anterior y no fue eliminado arriba, eliminarlo ahora
      if (apelacion.archivo) {
        const oldPath = path.join(uploadsDir, apelacion.archivo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      apelacion.archivo = nuevoArchivo;
    }

    if (profesorCorreo) {
      const nuevoProfesor = await userRepo.findOne({
        where: { email: profesorCorreo, role: "profesor" },
      });

      if (!nuevoProfesor) {
        return res.status(404).json({ message: "Profesor no encontrado." });
      }

      apelacion.profesor = nuevoProfesor;
    }

    // Forzar actualización del timestamp
    apelacion.updatedAt = new Date();

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

    const userId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;
    
    // Permitir acceso si es el profesor asignado o si es jefe de carrera
    if (userRole !== "jefecarrera" && (!userId || apelacion.profesor.id !== userId)) {
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
      apelacion.updatedAt = new Date();
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
    // Forzar actualización del timestamp
    apelacion.updatedAt = new Date();

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
      relations: ["alumno", "profesor"],
    });

    if (!apelacion) {
      return res.status(404).json({ message: "Apelación no encontrada." });
    }

    const userId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;

    // Validar permisos: solo puede eliminar el alumno dueño o el profesor asignado o jefe de carrera
    const esAlumno = userRole === "alumno" && apelacion.alumno.id === userId;
    const esProfesor = (userRole === "profesor" || userRole === "jefe_carrera") && apelacion.profesor?.id === userId;
    const esJefeCarrera = userRole === "jefe_carrera";

    if (!esAlumno && !esProfesor && !esJefeCarrera) {
      return res.status(403).json({
        message: "No tienes permisos para eliminar esta apelación.",
      });
    }

    // Solo se pueden eliminar apelaciones en estado pendiente o revisada
    if (!["pendiente", "revisada"].includes(apelacion.estado)) {
      return res.status(403).json({
        message: "Solo se pueden eliminar apelaciones en estado pendiente o revisada.",
      });
    }

    // Eliminar archivo asociado si existe
    if (apelacion.archivo) {
      const uploadsDir = path.resolve("src/uploads");
      const filePath = path.join(uploadsDir, apelacion.archivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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



export const getEvaluacionesDisponibles = async (req, res) => {
  try {
    const alumnoId = req.user?.id || req.user?.sub;

    if (!alumnoId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const pautaRepo = AppDataSource.getRepository(PautaEvaluada);
    const alumnoRepo = AppDataSource.getRepository("Alumno");

    const pautas = await pautaRepo.find({
      where: {
        alumno: { id: alumnoId },
      },
      order: { id: "DESC" },
    });

    // Obtener información del alumno con sus ramos
    const alumno = await alumnoRepo.findOne({
      where: { id: alumnoId },
      relations: ["secciones", "secciones.ramo"],
    });

    // Crear un mapa de código de ramo a nombre de ramo
    const ramoMap = new Map();
    if (alumno && alumno.secciones) {
      for (const seccion of alumno.secciones) {
        if (seccion.ramo) {
          ramoMap.set(seccion.ramo.codigo, seccion.ramo.nombre);
        }
      }
    }

    const disponibles = pautas
      .filter(p => p.notaFinal !== null)
      .map(p => ({
        id: p.id,
        codigoRamo: p.codigoRamo,
        nombreRamo: ramoMap.get(p.codigoRamo) || p.codigoRamo,
        notaFinal: p.notaFinal,
      }));

    return res.status(200).json({
      message: "Evaluaciones disponibles para apelación",
      data: disponibles,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error interno al obtener evaluaciones",
    });
  }
};



export const getEvaluacionesProximas = async (req, res) => {
  try {
    const alumnoId = req.user?.id || req.user?.sub;

    if (!alumnoId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const alumnoRepo = AppDataSource.getRepository("Alumno");
    const evaluacionRepo = AppDataSource.getRepository("Evaluacion");

    // Obtener el alumno con sus secciones -> ramo
    const alumno = await alumnoRepo.findOne({
      where: { id: alumnoId },
      relations: [
        "secciones",
        "secciones.ramo",
      ],
    });

    if (!alumno || !alumno.secciones || alumno.secciones.length === 0) {
      return res.status(200).json({
        message: "No estás inscrito en ningún ramo",
        data: [],
      });
    }

    // Obtener las evaluaciones próximas (futuras) de los ramos inscritos
    const ahora = new Date();
    const evaluacionesProximas = [];

    for (const seccion of alumno.secciones) {
      const ramo = seccion.ramo;
      if (!ramo) continue;

      const evaluaciones = await evaluacionRepo.find({
        where: {
          ramo: { id: ramo.id },
          seccion: { id: seccion.id },
        },
        order: { fechaProgramada: "ASC" },
      });

      // Filtrar solo las evaluaciones futuras
      const futuras = evaluaciones.filter(ev => {
        if (!ev.fechaProgramada) return false;
        return new Date(ev.fechaProgramada) > ahora;
      });

      evaluacionesProximas.push(...futuras.map(ev => ({
        id: ev.id,
        titulo: ev.titulo || "Evaluación",
        codigoRamo: ramo.codigo,
        nombreRamo: ramo.nombre,
        fechaProgramada: ev.fechaProgramada,
        seccion: seccion.numero,
      })));
    }

    // Ordenar por fecha
    evaluacionesProximas.sort((a, b) => 
      new Date(a.fechaProgramada) - new Date(b.fechaProgramada)
    );

    return res.status(200).json({
      message: "Evaluaciones próximas obtenidas",
      data: evaluacionesProximas,
    });

  } catch (error) {
    console.error("Error al obtener evaluaciones próximas:", error);
    return res.status(500).json({
      message: "Error interno al obtener evaluaciones próximas",
    });
  }
};


export const getProfesoresInscritos = async (req, res) => {
  try {
    const alumnoId = req.user?.id || req.user?.sub;

    if (!alumnoId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Obtener el alumno con sus secciones -> ramo -> profesor -> user
    const alumnoRepo = AppDataSource.getRepository("Alumno");

    const alumno = await alumnoRepo.findOne({
      where: { id: alumnoId },
      relations: [
        "secciones",
        "secciones.ramo",
        "secciones.ramo.profesor",
        "secciones.ramo.profesor.user",
      ],
    });

    if (!alumno || !alumno.secciones || alumno.secciones.length === 0) {
      return res.status(200).json({
        message: "No estás inscrito en ningún ramo",
        data: [],
      });
    }

    // Extraer profesores únicos a partir de las secciones y ramos
    const profesoresMap = new Map();

    for (const seccion of alumno.secciones) {
      const ramo = seccion.ramo;
      if (!ramo || !ramo.profesor || !ramo.profesor.user) continue;

      const profUser = ramo.profesor.user;
      const profId = profUser.id;

      if (!profesoresMap.has(profId)) {
        profesoresMap.set(profId, {
          id: profId,
          nombre: `${profUser.nombres || ''} ${profUser.apellidoPaterno || ''} ${profUser.apellidoMaterno || ''}`.trim(),
          email: profUser.email,
          ramos: [],
        });
      }

      profesoresMap.get(profId).ramos.push({
        codigo: ramo.codigo,
        nombre: ramo.nombre,
      });
    }

    const profesores = Array.from(profesoresMap.values()).map(prof => ({
      ...prof,
      ramosDisplay: prof.ramos.map(r => r.nombre).join(', '),
    }));

    return res.status(200).json({
      message: "Profesores inscritos obtenidos",
      data: profesores,
    });

  } catch (error) {
    console.error("Error al obtener profesores inscritos:", error);
    return res.status(500).json({
      message: "Error interno al obtener profesores inscritos",
    });
  }
};

