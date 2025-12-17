import cookies from "js-cookie";

const API_URL = "http://localhost:3000/api/apelaciones";

const authHeaders = () => {
  const token = cookies.get("jwt-auth");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ---------------------------------------------------------
// Crear apelación (con archivo, por eso NO se usa JSON)
// ---------------------------------------------------------
export const crearApelacion = async (formData) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: formData, // formData no lleva Content-Type
    });

    return await res.json();
  } catch (err) {
    console.error("Error creando apelación:", err);
  }
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


// ---------------------------------------------------------
// Descargar archivo adjunto
// ---------------------------------------------------------
export const descargarArchivo = (id) => {
  return `${API_URL}/${id}/archivo`; // URL directa para <a href="">
};



// ---------------------------------------------------------
// Eliminar apelación (profesor)
// ---------------------------------------------------------
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
