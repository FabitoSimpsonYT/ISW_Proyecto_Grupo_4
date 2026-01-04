
import { AppDataSource } from "../config/configDB.js";
import { User } from "../entities/user.entity.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository(User);

export async function createUser(data) {
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

export async function updateUserById(id, data, options = {}) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");

  const requireCurrentPassword = options.requireCurrentPassword || false;

  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findOneBy({ email: data.email });
    if (existing && String(existing.id) !== String(user.id)) {
      const err = new Error("El email ingresado ya está en uso por otro usuario.");
      err.code = "EMAIL_IN_USE";
      throw err;
    }
    user.email = data.email;
  }

  if (data.password) {
    if (requireCurrentPassword) {
      if (!data.currentPassword) {
        const err = new Error("Debes proporcionar la contraseña actual.");
        err.code = "CURRENT_PASSWORD_REQUIRED";
        throw err;
      }
      const matches = await bcrypt.compare(data.currentPassword, user.password);
      if (!matches) {
        const err = new Error("La contraseña actual no es correcta.");
        err.code = "CURRENT_PASSWORD_INVALID";
        throw err;
      }
    }
    user.password = await bcrypt.hash(data.password, 10);
  }

  if (data.telefono) {
    user.telefono = data.telefono;
  }

  await userRepository.save(user);
  return user;
}

export async function deleteUserById(id) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");
  await userRepository.remove(user);
}