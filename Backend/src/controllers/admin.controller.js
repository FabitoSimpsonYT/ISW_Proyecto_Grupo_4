import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import {
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin
} from "../services/admin.service.js";
import { createAdminValidation, updateAdminValidation } from "../validations/admin.validation.js";

export async function getAllAdminsHandler(req, res) {
    try {
        const admins = await getAllAdmins();
        res.status(200).json({ 
            message: "Administradores encontrados", 
            data: admins 
        });
    } catch (error) {
        console.error("Error en admin.controller.js -> getAllAdminsHandler(): ", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
}

export async function getAdminByIdHandler(req, res) {
    try {
        const { id } = req.params;
        const admin = await getAdminById(id);
        res.status(200).json({ 
            message: "Administrador encontrado", 
            data: admin 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        console.error("Error al obtener administrador", error);
        res.status(500).json({ message: "Error al obtener administrador." });
    }
}

export async function createAdminHandler(req, res) {
    try {
        const { error } = createAdminValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: "Error de validación", 
                error: error.details[0].message 
            });
        }

        const newAdmin = await createAdmin(req.body);
        res.status(201).json({
            message: "Administrador creado exitosamente",
            data: newAdmin
        });
    } catch (error) {
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al crear administrador: ", error);
        res.status(500).json({ message: "Error al crear administrador." });
    }
}

export async function updateAdminHandler(req, res) {
    try {
        const { id } = req.params;
        const { error } = updateAdminValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

       
        if (req.user.sub.toString() === id.toString()) {
            return res.status(400).json({ message: "No puedes modificar tu propio perfil desde aquí. Usa la ruta de perfil." });
        }

        const updatedAdmin = await updateAdmin(id, req.body);
        res.status(200).json({ 
            message: "Administrador actualizado correctamente", 
            data: updatedAdmin 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al actualizar administrador: ", error);
        res.status(500).json({ message: "Error al actualizar administrador." });
    }
}

export async function deleteAdminHandler(req, res) {
    try {
        const { id } = req.params;
        
        
        if (req.user.sub.toString() === id.toString()) {
            return res.status(400).json({ message: "No puedes eliminar tu propio perfil" });
        }

        await deleteAdmin(id);
        res.status(200).json({ message: "Administrador eliminado exitosamente" });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al eliminar administrador: ", error);
        res.status(500).json({ message: "Error al eliminar administrador." });
    }
}
