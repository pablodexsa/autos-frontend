import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface UserRole {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;   // ✅ AHORA ES OBJETO, NO STRING
}

interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string | number;
  email?: string;
  role?: any;        // Puede venir string u objeto
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  ready: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  ready: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  /** ✅ Normalizar rol siempre a objeto { id, name } */
  const normalizeRole = (role: any): UserRole => {
    if (!role) return { id: 0, name: "" };

    // Si ya es objeto
    if (typeof role === "object") {
      return { id: role.id, name: role.name };
    }

    // Si es string, convertirlo a objeto sin perder funcionalidad
    return { id: 0, name: role };
  };

  /** ✅ Normalizar usuario siempre al formato correcto */
  const normalizeUser = (u: any): User => {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
    };
  };

  /** ✅ Hidratación inicial desde localStorage */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          setToken(storedToken);
          setUser(normalizeUser(JSON.parse(storedUser)));   // ✅ NORMALIZADO
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

  /** ✅ Sincronizar logout entre pestañas */
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

  /** ✅ Login */
  const handleLogin = (newToken: string, rawUser: any) => {
    if (!newToken) return;

    const normalizedUser = normalizeUser(rawUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(newToken);
    setUser(normalizedUser);

    navigate("/home", { replace: true });
  };

  /** ✅ Logout */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (location.pathname !== "/login") navigate("/login", { replace: true });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
