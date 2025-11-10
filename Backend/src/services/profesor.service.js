import { AppDataSource } from "../config/configDb.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { User } from "../entities/user.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository(User);
const profesorRepository = AppDataSource.getRepository(Profesor);

export async function createProfesor(profesorData) {
  // Verificar RUT duplicado
  const existingRut = await userRepository.findOne({
    where: { rut: profesorData.rut }
  });

  if (existingRut) {
    throw new BadRequestError("El rut ya está registrado");
  }

  // Verificar email duplicado
  const existingEmail = await userRepository.findOne({
    where: { email: profesorData.email }
  });

  if (existingEmail) {
    throw new BadRequestError("El email ya está registrado");
  }

  // Verificar teléfono duplicado
  const existingTelefono = await userRepository.findOne({
    where: { telefono: profesorData.telefono }
  });

  if (existingTelefono) {
    throw new BadRequestError("El número de teléfono ya está registrado");
  }

  // Crear el usuario base
  const hashedPassword = await bcrypt.hash(profesorData.password, 10);
  const userData = {
    ...profesorData,
    password: hashedPassword,
    role: "profesor"
  };

  const newUser = await userRepository.save(userData);

  // Crear el perfil de profesor
  const profesorProfile = {
    id: newUser.id,
    especialidad: profesorData.especialidad,
    user: newUser
  };

  const newProfesor = await profesorRepository.save(profesorProfile);
  delete newProfesor.user.password;
  return newProfesor;
}

export async function getAllProfesores() {
  const profesores = await profesorRepository.find({
    relations: ["user"]
  });
  
  return profesores.map(profesor => {
    delete profesor.user.password;
    return profesor;
  });
}

export async function getProfesorById(id) {
  const profesor = await profesorRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  if (!profesor) {
    throw new NotFoundError("Profesor no encontrado");
  }

  delete profesor.user.password;
  return profesor;
}

export async function updateProfesor(id, profesorData) {
  const profesor = await profesorRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  if (!profesor) {
    throw new NotFoundError("Profesor no encontrado");
  }

  // Si se intenta actualizar el email, verificar que no exista
  if (profesorData.email && profesorData.email !== profesor.user.email) {
    const existingUser = await userRepository.findOne({
      where: { email: profesorData.email }
    });
    if (existingUser) {
      throw new BadRequestError("El email ya está registrado");
    }
  }

  // Actualizar datos de usuario
  if (profesorData.password) {
    profesorData.password = await bcrypt.hash(profesorData.password, 10);
  }
  
  await userRepository.update(id, {
    ...profesorData,
    role: "profesor" // Asegurar que el rol no cambie
  });

  // Actualizar datos específicos de profesor
  if (profesorData.especialidad) {
    await profesorRepository.update(id, {
      especialidad: profesorData.especialidad
    });
  }

  const updatedProfesor = await profesorRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  delete updatedProfesor.user.password;
  return updatedProfesor;
}

export async function deleteProfesor(id) {
  const profesor = await profesorRepository.findOne({
    where: { id },
    relations: ["user"]
  });

  if (!profesor) {
    throw new NotFoundError("Profesor no encontrado");
  }

  // Eliminar el profesor y el usuario asociado
  await profesorRepository.delete(id);
  await userRepository.delete(id);

  return { message: "Profesor eliminado correctamente" };
}