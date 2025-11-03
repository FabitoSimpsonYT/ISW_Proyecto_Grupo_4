import { AppDataSource } from "../config/configDb.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { User } from "../entities/user.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository(User);
const alumnoRepository = AppDataSource.getRepository(Alumno);

export async function createAlumno(alumnoData) {
  const existingUser = await userRepository.findOne({
    where: [{ email: alumnoData.email }, { rut: alumnoData.rut }],
  });

  if (existingUser) {
    throw new BadRequestError("El email o rut ya está registrado");
  }

  // Crear el usuario base
  const hashedPassword = await bcrypt.hash(alumnoData.password, 10);
  const userData = {
    ...alumnoData,
    password: hashedPassword,
    role: "alumno"
  };

  const newUser = await userRepository.save(userData);

  // Crear el perfil de alumno
  const alumnoProfile = {
    id: newUser.id,
    generacion: alumnoData.generacion,
    user: newUser
  };

  const newAlumno = await alumnoRepository.save(alumnoProfile);
  delete newAlumno.user.password;
  return newAlumno;
}

export async function getAllAlumnos() {
  const alumnos = await alumnoRepository.find({
    relations: {
      user: true
    }
  });

  return alumnos.map(alumno => {
    if (alumno.user) delete alumno.user.password;
    return alumno;
  });
}

export async function getAlumnoById(id) {
  const alumno = await alumnoRepository.findOne({
    where: { id },
    relations: ["user", "secciones"]
  });

  if (!alumno) {
    throw new NotFoundError("Alumno no encontrado");
  }

  if (alumno.user) delete alumno.user.password;
  return alumno;
}

export async function updateAlumno(id, alumnoData) {
  const alumno = await alumnoRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  if (!alumno) {
    throw new NotFoundError("Alumno no encontrado");
  }

  // Si se intenta actualizar el email, verificar que no exista
  if (alumnoData.email && alumnoData.email !== alumno.user.email) {
    const existingUser = await userRepository.findOne({
      where: { email: alumnoData.email }
    });
    if (existingUser) {
      throw new BadRequestError("El email ya está registrado");
    }
  }

  // Actualizar datos de usuario
  if (alumnoData.password) {
    alumnoData.password = await bcrypt.hash(alumnoData.password, 10);
  }

  await userRepository.update(id, {
    ...alumnoData,
    role: "alumno" // Asegurar que el rol sea alumno
  });

  // Actualizar datos específicos de alumno
  if (alumnoData.generacion) {
    await alumnoRepository.update(id, {
      generacion: alumnoData.generacion
    });
  }

  const updatedAlumno = await alumnoRepository.findOne({
    where: { id },
    relations: ["user", "secciones"]
  });

  if (updatedAlumno.user) delete updatedAlumno.user.password;
  return updatedAlumno;
}

export async function deleteAlumno(id) {
  const alumno = await alumnoRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  if (!alumno) {
    throw new NotFoundError("Alumno no encontrado");
  }

  // Eliminar el alumno y el usuario asociado
  await alumnoRepository.delete(id);
  await userRepository.delete(id);

  return { message: "Alumno eliminado correctamente" };
}
