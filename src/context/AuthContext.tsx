import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export type PermissionCode =
  | "CLIENT_CREATE"
  | "CLIENT_EDIT"
  | "RESERVATION_APPROVE"
  | "RESERVATION_CANCEL"
  | "RESERVATION_EDIT"
  | "VEHICLE_CREATE"
  | "VEHICLE_EDIT"
  | "VEHICLE_DELETE";

interface UserRole {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole; // se mantiene como objeto
  permissions: PermissionCode[]; // ✅ NUEVO
}

interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string | number;
  email?: string;
  role?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  ready: boolean;

  // ✅ Helpers
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  ready: false,

  hasPermission: () => false,
  hasAnyPermission: () => false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  /** Normalizar rol siempre a objeto { id, name } */
  const normalizeRole = (role: any): UserRole => {
    if (!role) return { id: 0, name: "" };

    if (typeof role === "object") {
      return { id: role.id ?? 0, name: role.name ?? "" };
    }

    return { id: 0, name: String(role) };
  };

  /** Normalizar permisos a array string[] */
  const normalizePermissions = (raw: any): PermissionCode[] => {
    const arr = Array.isArray(raw) ? raw : [];
    // guardamos solo strings
    return arr.filter((p) => typeof p === "string") as PermissionCode[];
  };

  /** Normalizar usuario al formato correcto */
  const normalizeUser = (u: any): User => {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      permissions: normalizePermissions(u.permissions), // ✅ NUEVO
    };
  };

  /** Hidratación inicial desde localStorage */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          setToken(storedToken);
          setUser(normalizeUser(JSON.parse(storedUser)));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setReady(true);
    }
  }, []);

  /** Sincronizar logout entre pestañas */
  useEffect(() => {
    const syncLogout = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        setToken(null);
        setUser(null);
        if (location.pathname !== "/login") navigate("/login", { replace: true });
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [location.pathname, navigate]);

  /** Login */
  const handleLogin = (newToken: string, rawUser: any) => {
    if (!newToken) return;

    const normalizedUser = normalizeUser(rawUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(newToken);
    setUser(normalizedUser);

    navigate("/home", { replace: true });
  };

  /** Logout */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (location.pathname !== "/login") navigate("/login", { replace: true });
  };

  // ✅ Helpers (memoizados)
  const permissionsSet = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);

  const hasPermission = (permission: PermissionCode) => {
    return permissionsSet.has(permission);
  };

  const hasAnyPermission = (permissions: PermissionCode[]) => {
    return permissions.some((p) => permissionsSet.has(p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login: handleLogin,
        logout: handleLogout,
        isAuthenticated: !!token,
        ready,

        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
