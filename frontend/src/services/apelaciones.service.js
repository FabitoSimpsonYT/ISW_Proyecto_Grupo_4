import cookies from "js-cookie";

const API_URL = "http://localhost:3000/api/apelaciones";

const authHeaders = () => {
  const token = cookies.get("jwt-auth");
  return {
    Authorization: `Bearer ${token}`,
  };
};


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
    return { data: [] };
  }
};



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

export const responderApelacion = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch (err) {
    console.error("Error respondiendo apelación:", err);
  }
};


export const descargarArchivo = (id) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${API_URL}/apelaciones/${id}/archivo`;
};




export const eliminarApelacion = async (id) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    return await res.json();
  } catch (err) {
    console.error("Error eliminando apelación:", err);
  }
};
