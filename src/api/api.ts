import axios from "axios";

// ?? Ajusta la URL base según donde corra tu backend
const api = axios.create({
  baseURL: "http://localhost:3000", // ? tu backend NestJS
  withCredentials: false,
});

// Interceptor para agregar token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
