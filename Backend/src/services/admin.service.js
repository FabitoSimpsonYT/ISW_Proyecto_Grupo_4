import { AppDataSource } from "../config/configDb.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { User } from "../entities/user.entity.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository(User);

export async function createAdmin(adminData) {
  const existingUser = await userRepository.findOne({
    where: [
      { email: adminData.email },
      { rut: adminData.rut },
      { telefono: adminData.telefono }
    ]
  });

  if (existingUser) {
    if (existingUser.email === adminData.email) {
      throw new BadRequestError("El email ya está registrado");
    }
    if (existingUser.rut === adminData.rut) {
      throw new BadRequestError("El rut ya está registrado");
    }
    if (existingUser.telefono === adminData.telefono) {
      throw new BadRequestError("El teléfono ya está registrado");
    }
  }


  const hashedPassword = await bcrypt.hash(adminData.password, 10);
  const userData = {
    ...adminData,
    password: hashedPassword,
    role: "admin"
  };

  const newAdmin = await userRepository.save(userData);
  const adminToReturn = { ...newAdmin };
  delete adminToReturn.password;
  
  return adminToReturn;
}

export async function getAllAdmins() {
  const admins = await userRepository.find({
    where: { role: "admin" }
  });

  return admins.map(admin => {
    const adminWithoutPassword = { ...admin };
    delete adminWithoutPassword.password;
    return adminWithoutPassword;
  });
}

export async function getAdminById(id) {
  const admin = await userRepository.findOne({
    where: { id, role: "admin" }
  });

  if (!admin) {
    throw new NotFoundError("Administrador no encontrado");
  }

  const adminWithoutPassword = { ...admin };
  delete adminWithoutPassword.password;
  return adminWithoutPassword;
}

export async function updateAdmin(id, adminData) {
  const admin = await userRepository.findOne({
    where: { id, role: "admin" }
  });

  if (!admin) {
    throw new NotFoundError("Administrador no encontrado");
  }

  if (adminData.email && adminData.email !== admin.email) {
    const existingEmail = await userRepository.findOne({
      where: { email: adminData.email }
    });
    if (existingEmail) {
      throw new BadRequestError("El email ya está registrado");
    }
  }

  if (adminData.telefono && adminData.telefono !== admin.telefono) {
    const existingPhone = await userRepository.findOne({
      where: { telefono: adminData.telefono }
    });
    if (existingPhone) {
      throw new BadRequestError("El teléfono ya está registrado");
    }
  }

  if (adminData.password) {
    adminData.password = await bcrypt.hash(adminData.password, 10);
  }

  await userRepository.update(id, {
    ...adminData,
    role: "admin"
  });

  const updatedAdmin = await userRepository.findOne({
    where: { id, role: "admin" }
  });

  const adminToReturn = { ...updatedAdmin };
  delete adminToReturn.password;
  return adminToReturn;
}

export async function deleteAdmin(id) {
  const admin = await userRepository.findOne({
    where: { id, role: "admin" }
  });

  if (!admin) {
    throw new NotFoundError("Administrador no encontrado");
  }

  const adminCount = await userRepository.count({
    where: { role: "admin" }
  });

  if (adminCount <= 1) {
    throw new BadRequestError("No se puede eliminar el último administrador del sistema");
  }

  await userRepository.delete(id);

  return { message: "Administrador eliminado correctamente" };
}