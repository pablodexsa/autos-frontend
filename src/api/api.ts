// src/api/api.ts
import axios from "axios";
import { API_URL } from "../config"; // ✅ usa la misma constante global

// ✅ Crea la instancia principal de Axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// ✅ Interceptor para agregar token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Interceptor de errores (debug)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
