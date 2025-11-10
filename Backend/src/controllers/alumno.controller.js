"use strict";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import {
    createAlumno,
    getAllAlumnos,
    getAlumnoById,
    updateAlumno,
    deleteAlumno
} from "../services/alumno.service.js";
import { createAlumnoValidation, updateAlumnoValidation } from "../validations/alumno.validation.js";

export async function getAllAlumnosHandler(req, res) {
    try {
        const alumnos = await getAllAlumnos();
        res.status(200).json({ 
            message: "Alumnos encontrados", 
            data: alumnos 
        });
    } catch (error) {
        console.error("Error en alumno.controller.js -> getAllAlumnosHandler(): ", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
}

export async function getAlumnoByIdHandler(req, res) {
    try {
        const { id } = req.params;
        const alumno = await getAlumnoById(id);
        res.status(200).json({ 
            message: "Alumno encontrado", 
            data: alumno 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        console.error("Error al obtener alumno", error);
        res.status(500).json({ message: "Error al obtener alumno." });
    }
}

export async function createAlumnoHandler(req, res) {
    try {
        const { error } = createAlumnoValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: "Error de validación", 
                error: error.details[0].message 
            });
        }

        const newAlumno = await createAlumno(req.body);
        res.status(201).json({
            message: "Alumno creado exitosamente",
            data: newAlumno
        });
    } catch (error) {
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al crear alumno: ", error);
        res.status(500).json({ message: "Error al crear alumno." });
    }
}

export async function updateAlumnoHandler(req, res) {
    try {
        const { id } = req.params;
        const { error } = updateAlumnoValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const updatedAlumno = await updateAlumno(id, req.body);
        res.status(200).json({ 
            message: "Alumno actualizado correctamente", 
            data: updatedAlumno 
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof BadRequestError) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error al actualizar alumno: ", error);
        res.status(500).json({ message: "Error al actualizar alumno." });
    }
}

export async function deleteAlumnoHandler(req, res) {
    try {
        const { id } = req.params;
        await deleteAlumno(id);
        res.status(200).json({ message: "Alumno eliminado exitosamente" });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        console.error("Error al eliminar alumno: ", error);
        res.status(500).json({ message: "Error al eliminar alumno." });
    }
}
