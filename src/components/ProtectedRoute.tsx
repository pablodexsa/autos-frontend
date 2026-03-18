import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { permissions } from "../permissions";

type ProtectedRouteProps = {
  children: React.ReactNode;
  roles?: string[]; // control por rol (admin-only, etc.)
  permissionKey?: string; // control por permiso (recommended)
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  permissionKey,
}) => {
  const { user, ready } = useAuth();
  const location = useLocation();

  // ✅ Esperar a que AuthContext termine de hidratar localStorage
  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f1b 0%, #1b1b2f 100%)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ✅ No logueado → login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // ✅ Rol (soporta user.role string o user.role.name)
  const role =
    typeof (user as any)?.role === "string"
      ? (user as any).role
      : (user as any)?.role?.name || "";

  // ✅ Si se especifican roles permitidos, validar
  if (roles?.length) {
    if (!roles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  // ✅ Si se especifica permissionKey, validar contra permissions.ts
  if (permissionKey) {
    const allowed = permissions[role] || [];
    if (!allowed.includes(permissionKey)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;