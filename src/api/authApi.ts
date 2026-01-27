// src/api/authApi.ts
import api from "./api";

export type LoginResponse = {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: any;
    permissions: string[];
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
    // ❌ NO guardamos token acá: lo guarda AuthContext cuando llamás login(token, user)
    return data;
  } catch (error: any) {
    console.error("❌ Error en login:", error?.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Error al iniciar sesión");
  }
}
