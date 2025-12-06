import { AppDataSource } from "../config/configDb.js";
import { Notificacion } from "../entities/notificacion.entity.js";
import { User } from "../entities/user.entity.js";
import { Seccion } from "../entities/seccion.entity.js";

const notificacionRepo = AppDataSource.getRepository(Notificacion);
const userRepo = AppDataSource.getRepository(User);
const seccionRepo = AppDataSource.getRepository(Seccion);

export const crearNotificacion = async (data) => {
  const notificacion = notificacionRepo.create(data);
  return await notificacionRepo.save(notificacion);
};

export const notificarAlumnos = async (
  targetId,
  titulo,
  mensaje,
  evaluacionId = null,
  options = { bySeccion: false }
) => {
  let alumnos = [];
  if (options.bySeccion) {
    const seccion = await seccionRepo.findOne({
      where: { id: targetId },
      relations: ["alumnos", "alumnos.user"],
    });
    if (seccion && seccion.alumnos) {
      alumnos = seccion.alumnos.map((a) => (a.user ? a.user : null)).filter(Boolean);
    }
  } else {
    try {
      alumnos = await userRepo.find({ where: { role: "alumno", ramo: { id: targetId } } });
    } catch (err) {
      alumnos = [];
    }
  }

  for (const alumno of alumnos) {
    const notificacion = notificacionRepo.create({
      titulo,
      mensaje,
      usuario: alumno,
      evaluacion: evaluacionId ? { id: evaluacionId } : null,
    });
    await notificacionRepo.save(notificacion);
  }
};

export const obtenerNotificacionesPorUsuario = async (usuarioId) => {
  return await notificacionRepo.find({
    where: { usuario: { id: usuarioId } },
    relations: ["evaluacion"],
    order: { fechaEnvio: "DESC" },
  });
};


export const marcarNotificacionComoLeida = async (id) => {
  const notificacion = await notificacionRepo.findOneBy({ id });
  if (!notificacion) return null;
  notificacion.leido = true;
  return await notificacionRepo.save(notificacion);
};
