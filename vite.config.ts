import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL || 
      (mode === "development" ? "http://localhost:3000/api" : "https://autos-backend-h3eb.onrender.com/api")
    ),
  },
  server: {
    proxy: {
      '/api': {
        target: mode === "development" ? 'http://localhost:3000' : 'https://autos-backend-h3eb.onrender.com', // Cambia dependiendo del entorno
        changeOrigin: true,
        secure: false, // Si el backend usa HTTPS
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Asegura que la ruta se reescriba correctamente
      },
    },
  },
}));
