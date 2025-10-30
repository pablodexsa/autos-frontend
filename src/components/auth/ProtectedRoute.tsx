import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Protege rutas privadas del sistema
 * @param {ReactNode} children - contenido a renderizar
 * @param {string[]} roles - lista de roles permitidos (opcional)
 */
export default function ProtectedRoute({ children, roles }: any) {
  const { user, token, loading } = useAuth();

  // Mientras se verifica el estado de autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900 text-white">
        Verificando acceso...
      </div>
    );
  }

  // Si no hay token ? redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si se definieron roles permitidos y el rol del usuario no está incluido ? redirigir
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-white">
        <h2 className="text-2xl font-semibold mb-2">Acceso restringido</h2>
        <p className="text-gray-400">
          Tu rol actual (<strong>{user?.role}</strong>) no tiene permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  // Autenticado y con rol válido
  return children;
}
