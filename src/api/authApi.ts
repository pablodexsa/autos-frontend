// src/api/authApi.ts
import api from "./api";

export async function login(username: string, password: string) {
  try {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", data.access_token);
    return data;
  } catch (error: any) {
    console.error("❌ Error en login:", error);
    throw new Error(error.response?.data?.message || "Error al iniciar sesión");
  }
}
