import axios from "axios";

// ✅ Toma la URL del backend desde el .env de Vite o usa localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ✅ Crea una instancia de Axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // cámbialo a true si después manejás cookies o sesiones
});

// ✅ Interceptor para agregar token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ (opcional) Interceptor de errores para debug
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error?.response || error);
    return Promise.reject(error);
  }
);

export default api;
