import cookies from "js-cookie";

const API_URL = "http://localhost:3000/api/apelaciones";

export const crearApelacion = async (formData) => {
  try {
    const token = cookies.get("jwt-auth");

    const res = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return await res.json();
  } catch (err) {
    console.error("Error creando apelación:", err);
  }
};

export const getMisApelaciones = async () => {
  try {
    const token = cookies.get("jwt-auth");

    const res = await fetch(`${API_URL}/mis-apelaciones`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await res.json();
  } catch (err) {
    console.error("Error obteniendo mis apelaciones:", err);
  }
};
