import { AppDataSource } from "../config/configDb.js";
import { User } from "../entities/user.entity.js";
import fs from "fs";
import path from "path";
/**
 * Guarda la ruta de un archivo en un campo de usuario.
 * @param {number} userId - ID del usuario
 * @param {string} field - nombre de la columna en User
 * @param {string} filePath - nombre del archivo subido
 */
export async function saveUserDocument(userId, field, filePath) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: userId });

    if (!user) return [null, "Usuario no encontrado"];

    user[field] = filePath;
    const updatedUser = await userRepo.save(user);

    return [updatedUser, null];
  } catch (error) {
    console.error("Error al guardar documento de usuario:", error);
    return [null, "Error interno del servidor"];
  }
}




export function renameUploadedFile(file, prefix, number) {
  if (!file) return null;

  const ext = path.extname(file.originalname); // ej: .pdf
  const newName = `${prefix}-${number}${ext}`;
  const newPath = path.join(file.destination, newName);
  
  fs.renameSync(file.path, newPath);

  return newName;
}
