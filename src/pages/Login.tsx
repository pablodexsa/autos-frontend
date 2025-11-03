import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../api/auth";
import "./Login.css";
import logo from "../assets/logo.jpeg"; // Importando el logo

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(email, password);

      // ✅ usa el formato { token, user } del backend
      if (!res?.token || !res?.user) {
        setError("Respuesta inesperada del servidor.");
      } else {
        login(res.token, res.user); // ← guarda sesión y redirige automáticamente
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Logo en la parte superior izquierda */}
      <div className="logo-container">
        <img src={logo} alt="De Grazia Automotores" className="login-logo" />
        <span className="login-title">De Grazia Automotores</span>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar sesión</h2>

        {error && <p className="login-error">{error}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <footer className="login-footer">
        <p>De Grazia Automotores © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
