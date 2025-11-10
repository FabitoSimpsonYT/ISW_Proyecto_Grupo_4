import { AppDataSource } from "../config/configDb.js";
import { Notificacion } from "../entities/notificacion.entity.js";
import { User } from "../entities/user.entity.js";

const notificacionRepo = AppDataSource.getRepository(Notificacion);
const userRepo = AppDataSource.getRepository(User);

// Crear una notificación manual
export const crearNotificacion = async (data) => {
  const notificacion = notificacionRepo.create(data);
  return await notificacionRepo.save(notificacion);
};

// Enviar notificación automática a todos los alumnos de un ramo/asignatura
export const notificarAlumnos = async (ramoId, titulo, mensaje, evaluacionId = null) => {
  const alumnos = await userRepo.find({
    where: { role: "alumno", ramo: { id: ramoId } },
  });

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

// Obtener notificaciones de un usuario
export const obtenerNotificacionesPorUsuario = async (usuarioId) => {
  return await notificacionRepo.find({
    where: { usuario: { id: usuarioId } },
    relations: ["evaluacion"],
    order: { fechaEnvio: "DESC" },
  });
};

// Marcar como leída
export const marcarNotificacionComoLeida = async (id) => {
  const notificacion = await notificacionRepo.findOneBy({ id });
  if (!notificacion) return null;
  notificacion.leido = true;
  return await notificacionRepo.save(notificacion);
};
