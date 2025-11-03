import { AppDataSource } from "../config/configDb.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { User } from "../entities/user.entity.js";

const ramosRepository = AppDataSource.getRepository(Ramos);
const profesorRepository = AppDataSource.getRepository(Profesor);

export async function createRamo(ramoData) {
  // Verificar que el código no esté duplicado
  const existingRamo = await ramosRepository.findOne({
    where: { codigo: ramoData.codigo }
  });

  if (existingRamo) {
    throw new BadRequestError("El código del ramo ya está registrado");
  }

  // Verificar que el profesor exista si se proporciona
  if (ramoData.rutProfesor) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { rut: ramoData.rutProfesor, role: "profesor" }
    });

    if (!user) {
      throw new BadRequestError("No se encontró un profesor con el RUT especificado");
    }

    const profesor = await profesorRepository.findOne({
      where: { id: user.id }
    });

    if (!profesor) {
      throw new BadRequestError("No se encontró el perfil del profesor");
    }

    // Crear el ramo
    const newRamo = ramosRepository.create({
      nombre: ramoData.nombre,
      codigo: ramoData.codigo,
      profesor: profesor
    });
    return await ramosRepository.save(newRamo);
  }

  // Si no se proporciona profesor, crear el ramo sin profesor asignado
  const newRamo = ramosRepository.create({
    nombre: ramoData.nombre,
    codigo: ramoData.codigo,
    profesor: null
  });

  return await ramosRepository.save(newRamo);
}

export async function getAllRamos() {
  return await ramosRepository.find({
    relations: ["profesor", "profesor.user", "secciones"]
  });
}

export async function getRamoById(id) {
  const ramo = await ramosRepository.findOne({
    where: { id },
    relations: ["profesor", "profesor.user", "secciones", "secciones.alumnos"]
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  return ramo;
}

export async function getRamoByCodigo(codigo) {
  const ramo = await ramosRepository.findOne({
    where: { codigo },
    relations: ["profesor", "profesor.user", "secciones", "secciones.alumnos"]
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  return ramo;
}

export async function updateRamo(id, ramoData) {
  // Verificar que el ramo exista
  const ramo = await ramosRepository.findOne({
    where: { id }
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  // Si se está actualizando el código, verificar que no esté en uso
  if (ramoData.codigo && ramoData.codigo !== ramo.codigo) {
    const existingRamo = await ramosRepository.findOne({
      where: { codigo: ramoData.codigo }
    });

    if (existingRamo) {
      throw new BadRequestError("El código del ramo ya está en uso");
    }
  }

  // Si se está actualizando el profesor, verificar que exista
  let profesor = undefined;
  if (ramoData.rutProfesor) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { rut: ramoData.rutProfesor, role: "profesor" }
    });

    if (!user) {
      throw new BadRequestError("No se encontró un profesor con el RUT especificado");
    }

    profesor = await profesorRepository.findOne({
      where: { id: user.id }
    });

    if (!profesor) {
      throw new BadRequestError("No se encontró el perfil del profesor");
    }
  }

  // Actualizar el ramo
  await ramosRepository.update(id, {
    ...ramoData,
    profesor: profesor
  });

  // Retornar el ramo actualizado
  return await ramosRepository.findOne({
    where: { id },
    relations: ["profesor", "profesor.user", "secciones"]
  });
}

export async function deleteRamo(id) {
  const ramo = await ramosRepository.findOne({
    where: { id }
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  await ramosRepository.remove(ramo);
  return { message: "Ramo eliminado correctamente" };
}