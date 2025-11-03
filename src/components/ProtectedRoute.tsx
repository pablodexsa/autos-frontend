import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, ready } = useAuth();
  const location = useLocation();

  // ⏳ Espera a que el contexto termine de hidratar
  if (!ready) {
    return null; // o un loader si querés
  }

  // Redirige al login si el usuario no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si existen roles definidos, verifica que el usuario tenga el rol adecuado
  if (roles && user && !roles.includes(user.role)) {
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
        }}
      >
        <h2>🚫 Acceso denegado</h2>
        <p>No tenés permiso para acceder a esta sección.</p>
      </div>
    );
  }

  // Si todo está bien, muestra el contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;
