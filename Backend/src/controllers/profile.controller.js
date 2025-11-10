import { handleSuccess } from "../Handlers/responseHandlers.js";
import { updateUserById, deleteUserById } from "../services/user.service.js";

export function getPublicProfile(req, res) {
  handleSuccess(res, 200, "Perfil público obtenido exitosamente", {
    message: "¡Hola! Este es un perfil público. Cualquiera puede verlo.",
  });
}


export function getPrivateProfile(req, res) {
  const user = req.user;
  handleSuccess(res, 200, "Perfil privado obtenido exitosamente", {
    message: `¡Hola, ${user.email}! Este es tu perfil privado. Solo tú puedes verlo.`,
    userData: user,
  });
}

export async function updatePrivateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;
    if (!email && !password) {
      return res.status(400).json({ message: "Debes enviar email y/o password para modificar." });
    }
    const updatedUser = await updateUserById(userId, { email, password });
    handleSuccess(res, 200, "Perfil actualizado exitosamente", { user: updatedUser });
  } catch (error) {
    if (error.code === "EMAIL_IN_USE") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al actualizar perfil", error: error.message });
  }
}

export async function deletePrivateProfile(req, res) {
  try {
    const userId = req.user.id;
    await deleteUserById(userId);
    handleSuccess(res, 200, "Perfil eliminado exitosamente", {});
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar perfil", error: error.message });
  }
}
