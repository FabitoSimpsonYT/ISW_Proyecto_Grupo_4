import cookies from "js-cookie";

const API_URL = `${import.meta.env.VITE_BASE_URL}/apelaciones`;

const authHeaders = () => {
  const token = cookies.get("jwt-auth");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ---------------------------------------------------------
// Crear apelación (con archivo)
// ---------------------------------------------------------
export const crearApelacion = async (formData) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders(), 
    body: formData,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(data?.message || "Error al crear apelación");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};


// ---------------------------------------------------------
// Ver mis apelaciones
// ---------------------------------------------------------
export const getMisApelaciones = async () => {
  try {
    const res = await fetch(`${API_URL}/mis-apelaciones`, {
      method: "GET",
      headers: authHeaders(),
    });

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo mis apelaciones:", err);
  }
};

// ---------------------------------------------------------
// Editar apelación (alumno)
// ---------------------------------------------------------
export const editarApelacion = async (id, formData) => {
  const res = await fetch(`${API_URL}/${id}/editar`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });

  return await res.json();
};


export const getEvaluacionesDisponibles = async () => {
  try {
    const res = await fetch(`${API_URL}/EvaluacionDisponible`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || "Error al obtener evaluaciones disponibles");
    }

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo evaluaciones disponibles:", err);
    return { data: [] }; // devuelvo un arreglo vacío si falla
  }
};

export const getEvaluacionesProximas = async () => {
  try {
    const res = await fetch(`${API_URL}/EvaluacionesProximas`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || "Error al obtener evaluaciones próximas");
    }

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo evaluaciones próximas:", err);
    return { data: [] };
  }
};

export const getProfesoresInscritos = async () => {
  try {
    const res = await fetch(`${API_URL}/ProfesoresInscritos`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || "Error al obtener profesores inscritos");
    }

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo profesores inscritos:", err);
    return { data: [] };
  }
};


// ---------------------------------------------------------
// Ver apelaciones como profesor
// ---------------------------------------------------------
export const getApelacionesProfesor = async () => {
  try {
    const res = await fetch(`${API_URL}/apelacionesProfesor`, {
      method: "GET",
      headers: authHeaders(),
    });

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo apelaciones del profesor:", err);
  }
};

// ---------------------------------------------------------
// Obtener apelación por ID
// ---------------------------------------------------------
export const getApelacionById = async (id) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: authHeaders(),
    });

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo apelación por ID:", err);
  }
};

// ---------------------------------------------------------
// Profesor responde apelación
// ---------------------------------------------------------
export const responderApelacion = async (id, data) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  let responseData;
  try {
    responseData = await res.json();
  } catch {
    responseData = null;
  }

  if (!res.ok) {
    const error = new Error(responseData?.message || "Error al responder apelación");
    error.status = res.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
};


// ---------------------------------------------------------
// Descargar archivo adjunto
// ---------------------------------------------------------
export const descargarArchivo = (id) => {
  const API_URL = import.meta.env.VITE_API_URL;
  return `${API_URL}/apelaciones/${id}/archivo`;
};




// ---------------------------------------------------------
// Eliminar apelación (profesor o alumno)
// ---------------------------------------------------------
export const eliminarApelacion = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(data?.message || "Error al eliminar apelación");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};
