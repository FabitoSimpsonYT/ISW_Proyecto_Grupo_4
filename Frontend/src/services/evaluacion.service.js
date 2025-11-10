import axios from "./root.service.js";

/**
 * obtener todas las evaluaciones 
 */
export async function getAllEvaluaciones() {
    try {
        const response = await axios.get("/evaluaciones");
        return response.data;
    } catch (error) {
        return error.response?.data || {message: "error al obtener las evaluaciones"};

    }

}
export async function getEvaluacionById(id) {
    try {
        const response = await axios.get(`/evaluaciones/${id}`);
        return response.data;
    } catch (error) {
        return error.response?.data || {message: "error al obtener la evaluavion"};

    }
    
}
/**
 * crear evaluacion
 */
export async function createEvaluacion(evaluacionData) {
    try {
        const response = await axios.post("/evaluaciones", evaluacionData);
        return response.data.data;
    } catch (error) {
        throw error.response?.data || { message: "Error al crear la evaluación" };
    }
}
/**
 * actualizar evaluacion
 */
export async function updateEvaluacion(id, evaluacionData) {
    try {
        const response = await axios.put(`/evaluaciones/${id}`,evaluacionData);
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