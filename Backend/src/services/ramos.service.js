import { AppDataSource } from "../config/configDb.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { User } from "../entities/user.entity.js";

const ramosRepository = AppDataSource.getRepository(Ramos);
const profesorRepository = AppDataSource.getRepository(Profesor);

export async function createRamo(ramoData) {
  const existingRamo = await ramosRepository.findOne({
    where: { codigo: ramoData.codigo }
  });

  if (existingRamo) {
    throw new BadRequestError("El código del ramo ya está registrado");
  }

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

    const newRamo = ramosRepository.create({
      nombre: ramoData.nombre,
      codigo: ramoData.codigo,
      profesor: profesor
    });
    return await ramosRepository.save(newRamo);
  }

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

export async function updateRamo(codigo, ramoData) {
  const ramo = await ramosRepository.findOne({
    where: { codigo }
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  if (ramoData.codigo && ramoData.codigo !== codigo) {
    const existingRamo = await ramosRepository.findOne({
      where: { codigo: ramoData.codigo }
    });

    if (existingRamo) {
      throw new BadRequestError("El código del ramo ya está en uso");
    }
  }

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

  await ramosRepository.update({ codigo }, {
    ...ramoData,
    profesor: profesor
  });

  const updatedRamo = await ramosRepository.findOne({
    where: { codigo: ramoData.codigo || codigo },
    relations: ["profesor", "profesor.user", "secciones"]
  });

  if (updatedRamo.profesor?.user) {
    return {
      codigo: updatedRamo.codigo,
      nombre: updatedRamo.nombre,
      profesor: {
        rut: updatedRamo.profesor.user.rut,
        nombre: updatedRamo.profesor.user.nombre,
        apellido: updatedRamo.profesor.user.apellido
      },
      secciones: updatedRamo.secciones.map(seccion => ({
        numero: seccion.numero
      }))
    };
  }

  return {
    codigo: updatedRamo.codigo,
    nombre: updatedRamo.nombre,
    secciones: updatedRamo.secciones.map(seccion => ({
      numero: seccion.numero
    }))
  };
}

export async function deleteRamo(codigo) {
  const ramo = await ramosRepository.findOne({
    where: { codigo }
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  await ramosRepository.remove(ramo);
  return { message: "Ramo eliminado correctamente" };
}

export async function getRamosByUser(userId, role) {
  if (role === "alumno") {
    const userRepository = AppDataSource.getRepository(User);
    const alumnoRepository = AppDataSource.getRepository(Alumno);
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const alumno = await alumnoRepository.findOne({
      where: { id: userId },
      relations: [
        "secciones",
        "secciones.ramo",
        "secciones.ramo.profesor",
        "secciones.ramo.profesor.user"
      ]
    });

    if (!alumno) {
      throw new NotFoundError("Alumno no encontrado");
    }

    const ramosInscritos = alumno.secciones.map(seccion => {
      const { ramo } = seccion;
      const profesor = ramo.profesor?.user;
      
      return {
        codigo: ramo.codigo,
        nombre: ramo.nombre,
        seccion: {
          numero: seccion.numero
        },
        profesor: profesor ? {
          rut: profesor.rut,
          nombre: profesor.nombre,
          apellido: profesor.apellido
        } : null,
        alumno: {
          rut: user.rut
        }
      };
    });

    return ramosInscritos;

  } else if (role === "profesor") {
    const userRepository = AppDataSource.getRepository(User);
    const profesorRepository = AppDataSource.getRepository(Profesor);
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const profesor = await profesorRepository.findOne({
      where: { id: userId },
      relations: [
        "ramos",
        "ramos.secciones",
        "ramos.secciones.alumnos",
        "ramos.secciones.alumnos.user"
      ]
    });

    if (!profesor) {
      throw new NotFoundError("Profesor no encontrado");
    }

    const ramosDictados = profesor.ramos.map(ramo => ({
      codigo: ramo.codigo,
      nombre: ramo.nombre,
      profesor: {
        rut: user.rut,
        nombre: user.nombre,
        apellido: user.apellido
      },
      secciones: ramo.secciones.map(seccion => ({
        numero: seccion.numero,
        alumnos: seccion.alumnos.map(alumno => ({
          rut: alumno.user.rut,
          nombre: alumno.user.nombre,
          apellido: alumno.user.apellido
        }))
      }))
    }));

    return ramosDictados;
  }

  throw new BadRequestError("Rol no válido para esta operación");
}