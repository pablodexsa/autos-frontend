import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { login as apiLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiLogin(email, password);

      const token = data.access_token || (data as any).token;
      if (!token || !data.user) {
        setError("Respuesta inesperada del servidor.");
        return;
      }

      login(token, data.user);
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "#1c1c2e",
        color: "#fff",
      }}
    >
      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <img src={logo} alt="De Grazia Automotores" style={{ width: 48, borderRadius: 8 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          De Grazia Automotores
        </Typography>
      </Box>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Login
      </Typography>

      <form onSubmit={handleSubmit} style={{ width: 360 }}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2, bgcolor: "#2a2a40", borderRadius: 1 }}
          InputProps={{ style: { color: "#fff" } }}
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2, bgcolor: "#2a2a40", borderRadius: 1 }}
          InputProps={{ style: { color: "#fff" } }}
        />
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button type="submit" variant="contained" fullWidth disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Iniciar sesión"}
        </Button>
      </form>
    </Box>
  );
}
