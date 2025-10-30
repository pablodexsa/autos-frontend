import axios from "axios";

// ? Asegúrate de incluir /api en la URL base
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function login(username: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });

    localStorage.setItem("token", response.data.access_token);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error al iniciar sesión");
  }
}
