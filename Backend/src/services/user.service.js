
import { AppDataSource } from "../config/configDb.js";
import { User } from "../entities/user.entity.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository(User);

export async function createUser(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = userRepository.create({
    email: data.email,
    password: hashedPassword,
  });

  return await userRepository.save(newUser);
}

export async function findUserByEmail(email) {
  return await userRepository.findOneBy({ email });
}

export async function updateUserById(id, data) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");
  if (data.email && data.email !== user.email) {
    // Verificar si el email ya está en uso por otro usuario
    const existing = await userRepository.findOneBy({ email: data.email });
    if (existing && String(existing.id) !== String(user.id)) {
      const err = new Error("El email ingresado ya está en uso por otro usuario.");
      err.code = "EMAIL_IN_USE";
      throw err;
    }
    user.email = data.email;
  }
  if (data.password) user.password = await bcrypt.hash(data.password, 10);
  await userRepository.save(user);
  return user;
}

export async function deleteUserById(id) {
  const user = await userRepository.findOneBy({ id });
  if (!user) throw new Error("Usuario no encontrado");
  await userRepository.remove(user);
}