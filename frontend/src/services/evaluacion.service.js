import axios from "./root.service.js";

/**
 * Obtener RUT del token JWT almacenado en localStorage
 */
function getRutFromToken() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.rut || null;
    } catch (error) {
        console.error("Error al obtener RUT del token:", error);
        return null;
    }
}

/**
 * obtener todas las evaluaciones 
 */
export async function getAllEvaluaciones() {
    try {
        const response = await axios.get("/evaluaciones");
        return response.data?.data?.evaluaciones || [];
    } catch (error) {
        return error.response?.data || {message: "error al obtener las evaluaciones"};

    }

}
export async function getEvaluacionById(codigoRamo, idEvaluacion) {
    try {
        const url = idEvaluacion ? `/evaluaciones/${codigoRamo}/${idEvaluacion}` : `/evaluaciones/${codigoRamo}`;
        const response = await axios.get(url);
        return response.data?.data?.evaluacion || null;
    } catch (error) {
        return error.response?.data || {message: "error al obtener la evaluavion"};

    }
    
}

export async function getEvaluacionesByCodigoRamo(codigoRamo) {
    try {
        const response = await axios.get(`/evaluaciones/${encodeURIComponent(codigoRamo)}`);
        console.log("Status:", response.status);
        console.log("Respuesta completa de evaluaciones:", response.data);
        
        // La estructura es: {message, data: {evaluaciones: []}, status}
        const evaluaciones = response.data?.data?.evaluaciones || [];
        
        console.log("Evaluaciones procesadas:", evaluaciones);
        return Array.isArray(evaluaciones) ? evaluaciones : [];
    } catch (error) {
        console.error("Error al obtener evaluaciones:", error);
        throw error.response?.data || { message: "Error al obtener evaluaciones del ramo" };
    }
}
/**
 * crear evaluacion
 */
export async function createEvaluacion(evaluacionData) {
    try {
        console.log("Enviando POST a /evaluaciones con datos:", evaluacionData);
        const response = await axios.post("/evaluaciones", evaluacionData);
        console.log("Respuesta del servidor:", response.data);
        return response.data?.data?.evaluacion || response.data?.data || null;
    } catch (error) {
        console.error("Error al crear evaluación:", error);
        console.error("Error response:", error.response?.data);
        const errorData = error.response?.data || { message: "Error al crear la evaluación" };
        const errorObj = new Error(errorData.message || errorData.error || "Error al crear la evaluación");
        throw errorObj;
    }
}
/**
 * actualizar evaluacion
 */
export async function updateEvaluacion(id, evaluacionData) {
    try {
        const response = await axios.patch(`/evaluaciones/${id}`,evaluacionData);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data || { message: "error al actualizar la evaluacion" };
        const errorObj = new Error(errorData.message || errorData.error || "error al actualizar la evaluacion");
        throw errorObj;
    }
    
}
/**
 * eliminar evaluacion
 */
export async function deleteEvaluacion(id) {
    try {
        const response = await axios.delete(`/evaluaciones/${id}`);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data || { message: "error al eliminar la evaluacion" };
        const errorObj = new Error(errorData.message || errorData.error || "error al eliminar la evaluacion");
        throw errorObj;
    }
    
}

// Objeto de servicio para compatibilidad con AgendaProfesor
export const evaluacionService = {
    obtenerMisEventos: async (params) => {
        try {
            const response = await axios.get("/evaluaciones/mis-eventos", { params });
            return { data: response.data };
        } catch (error) {
            return { data: { eventos: [] } };
        }
    },
    crear: async (data) => {
        try {
            const response = await axios.post("/evaluaciones/eventos/crear", data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    actualizar: updateEvaluacion,
    eliminar: deleteEvaluacion,
};

export const inscripcionService = {
    obtenerPorEvento: async (eventoId) => {
        try {
            const response = await axios.get(`/inscripciones/evento/${eventoId}`);
            return { data: response.data };
        } catch (error) {
            return { data: { inscripciones: [] } };
        }
    },
};

export async function getPautaEvaluadaByAlumno(idEvaluacion, rutAlumno) {
    try {
        // Si no se proporciona RUT, extraerlo del token
        const rut = rutAlumno || getRutFromToken();
        if (!rut) {
            throw new Error("No se pudo obtener el RUT del usuario");
        }
        
        const response = await axios.get(`/pauta-evaluadas/${idEvaluacion}/${rut}`);
        console.log("Respuesta pauta evaluada:", response.data);
        return response.data?.data?.pautaEvaluada || null;
    } catch (error) {
        // Si no hay pauta evaluada, retorna null en lugar de lanzar error
        console.error("Error al obtener pauta evaluada:", error);
        return null;
    }
}

export async function getPautasEvaluadasByEvaluacion(idEvaluacion) {
    try {
        const response = await axios.get(`/pauta-evaluadas/${idEvaluacion}`);
        console.log("Respuesta pautas evaluadas:", response.data);
        return response.data?.data || [];
    } catch (error) {
        console.error("Error al obtener pautas evaluadas:", error);
        return [];
    }
}

export async function getPautaEvaluadaCompleta(idEvaluacion, rutAlumno) {
    try {
        // Si no se proporciona RUT, extraerlo del token
        const rut = rutAlumno || getRutFromToken();
        if (!rut) {
            throw new Error("No se pudo obtener el RUT del usuario");
        }

        const response = await axios.get(`/pauta-evaluadas/${idEvaluacion}/${rut}`);
        const pautaData = response.data?.data?.pautaEvaluada || null;
        if (pautaData) {
            console.log("Pauta evaluada completa:", pautaData);
            return {
                calificacionFinal: pautaData.calificacionFinal || pautaData.notaFinal || pautaData.nota,
                puntajeObtenido: pautaData.puntajeObtenido,
                idPauta: pautaData.idPauta,
                criterios: pautaData.criterios || [],
                ...pautaData
            };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener pauta evaluada completa:", error);
        return null;
    }
}