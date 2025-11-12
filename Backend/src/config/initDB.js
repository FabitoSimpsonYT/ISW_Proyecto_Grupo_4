"use strict";

import bcrypt from "bcrypt";
import { AppDataSource } from "./configDb.js";
import { User } from "../entities/user.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { Alumno } from "../entities/alumno.entity.js";

export async function initDB() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("=> Conexión a la base de datos inicializada desde initDB");
    }
    await createUsers();
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    process.exit(1);
  }
}

export async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const profesorRepository = AppDataSource.getRepository(Profesor);
    const alumnoRepository = AppDataSource.getRepository(Alumno);

    const count = await userRepository.count();
    if (count > 0) {
      console.log("Usuarios ya existen, omitiendo creación de datos por defecto.");
      return;
    }

    console.log("Creando usuarios y perfiles por defecto...");

    const adminUser = userRepository.create({
      nombres: "Administrador",
      apellidoPaterno: "Sistema",
      apellidoMaterno: "Admin",
      rut: "00000000-0",
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      telefono: "000000000"
    });
    await userRepository.save(adminUser);
    console.log(`Usuario admin '${adminUser.email}' creado.`);

    const profesorUser = userRepository.create({
      nombres: "Juan",
      apellidoPaterno: "Pérez",
      apellidoMaterno: "González",
      rut: "11111111-1",
      email: "profesor@example.com",
      password: await bcrypt.hash("profesor123", 10),
      role: "profesor",
      telefono: "111111111"
    });
    await userRepository.save(profesorUser);

    const profesorProfile = profesorRepository.create({
      id: profesorUser.id,
      especialidad: "Ingeniería de Software",
      user: profesorUser
    });
    await profesorRepository.save(profesorProfile);
    console.log(`Profesor '${profesorUser.email}' creado con especialidad '${profesorProfile.especialidad}'.`);

    const alumnoUser = userRepository.create({
      nombres: "María",
      apellidoPaterno: "López",
      apellidoMaterno: "Silva",
      rut: "22222222-2",
      email: "alumno@example.com",
      password: await bcrypt.hash("alumno123", 10),
      role: "alumno",
      telefono: "222222222"
    });
    await userRepository.save(alumnoUser);

    const alumnoProfile = alumnoRepository.create({
      id: alumnoUser.id,
      generacion: "2025",
      user: alumnoUser
    });
    await alumnoRepository.save(alumnoProfile);
    console.log(`Alumno '${alumnoUser.email}' creado con generación '${alumnoProfile.generacion}'.`);

  } catch (error) {
    console.error("Error al crear usuarios y perfiles:", error);
    process.exit(1);
  }
}

export default initDB;