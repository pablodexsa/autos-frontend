// src/config.ts

// Detecta el modo actual (development, production, etc.)
const MODE = import.meta.env.MODE;

// Determina la URL base según el modo o variable de entorno
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (MODE === "production"
    ? "https://autos-backend-h3eb.onrender.com/api"
    : "https://autos-backend-h3eb.onrender.com/api");

// Log de depuración: muestra a qué API está apuntando el frontend
if (typeof window !== "undefined") {
  console.log(`🌐 API_URL (${MODE}):`, API_URL);
}

export const IS_DEV = MODE === "development";
