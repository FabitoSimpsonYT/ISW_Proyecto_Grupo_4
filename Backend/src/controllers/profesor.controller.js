"use strict";
import { BadRequestError, NotFoundError, handleErrorClient } from "../Handlers/responseHandlers.js";
import {
    createProfesor,
    getAllProfesores,
    getProfesorById,
    updateProfesor,
    deleteProfesor
} from "../services/profesor.service.js";
import { createProfesorValidation, updateProfesorValidation } from "../validations/profesor.validation.js";

export async function getAllProfesoresHandler(req, res) {
    try {
        const profesores = await getAllProfesores();
        res.status(200).json({ 
            message: "Profesores encontrados", 
            data: profesores 
        });
    } catch (error) {
        console.error("Error en profesor.controller.js -> getAllProfesoresHandler(): ", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
}

export async function getProfesorByIdHandler(req, res) {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        let id;

        // Si es admin y proporciona un ID específico, usar ese ID
        if (userRole === "admin" && req.params.id) {
            id = req.params.id;
        } else {
            // Si es profesor o no se proporciona ID, usar el ID del token
            id = userId;
        }

        const profesor = await getProfesorById(id);
        
        // Si es profesor, solo puede ver su propio perfil
        if (userRole === "profesor" && profesor.user.id !== userId) {
            return res.status(403).json({ message: "No tienes permiso para ver este perfil" });
        }

        res.status(200).json({ 
            message: "Profesor encontrado", 
            data: profesor 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        console.error("Error al obtener profesor", error);
        res.status(500).json({ message: "Error al obtener profesor." });
    }
}

export async function createProfesorHandler(req, res) {
    try {
        const { error } = createProfesorValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: "Error de validación", 
                error: error.details[0].message 
            });
        }

        const newProfesor = await createProfesor(req.body);
        res.status(201).json({
            message: "Profesor creado exitosamente",
            data: newProfesor
        });
    } catch (error) {
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al crear profesor: ", error);
        res.status(500).json({ message: "Error al crear profesor." });
    }
}

export async function updateProfesorHandler(req, res) {
    try {
        const { id } = req.params;
        const { error } = updateProfesorValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const updatedProfesor = await updateProfesor(id, req.body);
        res.status(200).json({ 
            message: "Profesor actualizado correctamente", 
            data: updatedProfesor 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al actualizar profesor: ", error);
        res.status(500).json({ message: "Error al actualizar profesor." });
    }
}

export async function deleteProfesorHandler(req, res) {
    try {
        const { id } = req.params;
        await deleteProfesor(id);
        res.status(200).json({ message: "Profesor eliminado exitosamente" });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        console.error("Error al eliminar profesor: ", error);
        res.status(500).json({ message: "Error al eliminar profesor." });
    }
}