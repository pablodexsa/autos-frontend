import api from "./api";

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;          // ✅ viene como string
    permissions: string[]; // ✅ viene del backend
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  roleId: number
) {
  const { data } = await api.post("/auth/register", { name, email, password, roleId });
  return data;
}

export async function getProfile() {
  const { data } = await api.get("/auth/profile");
  return data;
}
