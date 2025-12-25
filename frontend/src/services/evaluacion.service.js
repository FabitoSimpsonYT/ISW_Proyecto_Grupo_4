import axios from "./root.service.js";

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
export async function getEvaluacionById(id) {
    try {
        const response = await axios.get(`/evaluaciones/${id}`);
        return response.data?.data?.evaluacion || null;
    } catch (error) {
        return error.response?.data || {message: "error al obtener la evaluavion"};

    }
    
}

export async function getEvaluacionesByCodigoRamo(codigoRamo) {
    try {
        const response = await axios.get(`/evaluaciones/${encodeURIComponent(codigoRamo)}`);
        return response.data?.data?.evaluaciones || [];
    } catch (error) {
        throw error.response?.data || { message: "Error al obtener evaluaciones del ramo" };
    }
}
/**
 * crear evaluacion
 */
export async function createEvaluacion(evaluacionData) {
    try {
        const response = await axios.post("/evaluaciones", evaluacionData);
   
        return response.data?.data?.evaluacion || response.data?.data || null;
    } catch (error) {
        throw error.response?.data || { message: "Error al crear la evaluación" };
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
        return error.response?.data || {message : "error al actulizar la evaluacion"};
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
        return error.response?.data || {message: "error al eliminar la evaluacion"};
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