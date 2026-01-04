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
    const requester = req.user;
    // If requester is admin, allow multiple fields
    if (requester.role === 'admin') {
      const data = req.body;
      if (Object.keys(data).length === 0) return res.status(400).json({ message: "No hay datos para actualizar." });
      const updatedUser = await updateUserById(userId, data);
      handleSuccess(res, 200, "Perfil actualizado exitosamente", { user: updatedUser });
      return;
    }

    // Non-admins (regular users) can only update their password and telefono
    const { password, telefono, currentPassword } = req.body;
    if (!password && !telefono) {
      return res.status(400).json({ message: "Solo puedes actualizar contraseña y teléfono." });
    }
    const updatedUser = await updateUserById(userId, { password, telefono, currentPassword }, { requireCurrentPassword: !!password });
    handleSuccess(res, 200, "Perfil actualizado exitosamente", { user: updatedUser });
  } catch (error) {
    if (error.code === "EMAIL_IN_USE" || error.code === "PHONE_IN_USE" || error.code === "PHONE_INVALID") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === "CURRENT_PASSWORD_REQUIRED" || error.code === "CURRENT_PASSWORD_INVALID") {
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
