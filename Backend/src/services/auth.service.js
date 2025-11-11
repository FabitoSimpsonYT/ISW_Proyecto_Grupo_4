import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail } from "./user.service.js";

export async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Credenciales incorrectas");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Credenciales incorrectas");
  }

  const payload = { 
    sub: user.rut, // Usamos RUT como identificador natural
    nombres: user.nombres,
    email: user.email,
    role: user.role,
    id: user.id  // Añadir id también al payload para que esté disponible en req.user
  };
  console.log(`[auth.service] Generated JWT payload: sub=${payload.sub} role=${payload.role} id=${payload.id}`);
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

  delete user.password;
  const safeUser = {
    rut: user.rut,
    nombres: user.nombres,
    apellidoPaterno: user.apellidoPaterno,
    apellidoMaterno: user.apellidoMaterno,
    email: user.email,
    telefono: user.telefono,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return { user: safeUser, token };
}
