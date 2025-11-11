import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Roles permitidos: ["admin"], ["admin","gerencia"], etc.
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, ready } = useAuth();
  const location = useLocation();

  // ⏳ 1) Esperar a que AuthContext cargue el usuario
  if (!ready) return null;

  // ❌ 2) Usuario NO logueado → redirigir a login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ 3) Obtener el rol real del usuario
const userRole =
  typeof user?.role === "string"
    ? user.role
    : user?.role?.name;


  // ❌ 4) Si se definieron roles permitidos y el rol del usuario no está
  if (roles && !roles.includes(userRole)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          color: "#fff",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f0f1b 0%, #1b1b2f 100%)",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>🚫 Acceso denegado</h2>
        <p style={{ opacity: 0.8 }}>No tenés permiso para acceder a esta sección.</p>
      </div>
    );
  }

  // ✅ 5) Todo OK → mostrar el contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;
