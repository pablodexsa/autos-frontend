import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import logo from "../assets/logo.jpeg"; // 👈 asegurate que este archivo exista

const Home = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      sx={{
        background: "radial-gradient(circle at center, #111 0%, #000 100%)",
        color: "#fff",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Contenedor del logo */}
      <Box position="relative" sx={{ width: 300, height: 150, mb: 3 }}>
        {/* ✅ Logo principal con fade-in */}
        <motion.img
          src={logo}
          alt="GL Motors"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0px 0px 12px rgba(255,255,255,0.3))",
            position: "relative",
            zIndex: 2,
          }}
          onError={(e) => {
            console.error("❌ Error cargando logo:", e.currentTarget.src);
            e.currentTarget.src = "https://via.placeholder.com/300x150?text=Logo";
          }}
        />

        {/* ✨ Efecto brillo animado */}
        <motion.div
          initial={{ x: "-150%" }}
          animate={{ x: "150%" }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
            repeatDelay: 2,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "60%",
            height: "100%",
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.0) 100%)",
            transform: "skewX(-20deg)",
            zIndex: 3,
          }}
        />
      </Box>

      {/* Textos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2 }}
      >
        <Typography variant="h4" fontWeight={600}>
          Bienvenido a GL Motors
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1, color: "#aaa" }}>
          Sistema de gestión de ventas, clientes y presupuestos
        </Typography>
      </motion.div>
    </Box>
  );
};

export default Home;

