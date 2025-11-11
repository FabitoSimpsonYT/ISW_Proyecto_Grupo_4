
import { AppDataSource } from "../config/configDb.js";
import { User } from "../entities/user.entity.js";
import bcrypt from "bcrypt";
import { createValidation, telefonoPattern } from "../validations/users.validation.js";

const userRepository = AppDataSource.getRepository(User);

export async function createUser(data) {
  const { error: validationError } = createValidation.validate(data);
  if (validationError) {
    const err = new Error(validationError.message);
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  
  const existingRut = await userRepository.findOneBy({ rut: data.rut });
  if (existingRut) {
    const error = new Error("El RUT ya está registrado");
    error.code = "RUT_IN_USE";
    throw error;
  }
  
  const existingEmail = await userRepository.findOneBy({ email: data.email });
  if (existingEmail) {
    const error = new Error("El email ya está registrado");
    error.code = "EMAIL_IN_USE";
    throw error;
  }

  const existingPhone = await userRepository.findOneBy({ telefono: data.telefono });
  if (existingPhone) {
    const error = new Error("El teléfono ya está registrado");
    error.code = "PHONE_IN_USE";
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = userRepository.create({
    email: data.email,
    password: hashedPassword,
    rut: data.rut,
    nombres: data.nombres,
    apellidoPaterno: data.apellidoPaterno,
    apellidoMaterno: data.apellidoMaterno,
    role: data.role,
    telefono: data.telefono
  });

  return await userRepository.save(newUser);
}

export async function findUserByEmail(email) {
  return await userRepository.findOneBy({ email });
}

export async function findUserByRut(rut) {
  return await userRepository.findOneBy({ rut });
}

export async function updateUserById(id, data) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");
  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findOneBy({ email: data.email });
    if (existing && String(existing.id) !== String(user.id)) {
      const err = new Error("El email ingresado ya está en uso por otro usuario.");
      err.code = "EMAIL_IN_USE";
      throw err;
    }
    user.email = data.email;
  }
  if (data.telefono && data.telefono !== user.telefono) {
    if (!telefonoPattern.test(data.telefono) || data.telefono.length !== 12) {
      const err = new Error("El teléfono debe tener el formato +56912345678 o +56411234567 (12 caracteres).");
      err.code = "PHONE_INVALID";
      throw err;
    }

    const existingPhone = await userRepository.findOneBy({ telefono: data.telefono });
    if (existingPhone && String(existingPhone.id) !== String(user.id)) {
      const err = new Error("El teléfono ingresado ya está en uso por otro usuario.");
      err.code = "PHONE_IN_USE";
      throw err;
    }
    user.telefono = data.telefono;
  }
  if (data.password) user.password = await bcrypt.hash(data.password, 10);
  if (data.nombres) user.nombres = data.nombres;
  if (data.apellidoPaterno) user.apellidoPaterno = data.apellidoPaterno;
  if (data.apellidoMaterno) user.apellidoMaterno = data.apellidoMaterno;
  if (data.role) user.role = data.role;
  await userRepository.save(user);
  return user;
}

export async function deleteUserById(id) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");
  await userRepository.remove(user);
}
