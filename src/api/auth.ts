import { http } from "./http";

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: { name: string };
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function register(name: string, email: string, password: string, roleId: number) {
  const { data } = await http.post("/auth/register", { name, email, password, roleId });
  return data;
}

export async function getProfile() {
  const { data } = await http.get("/auth/profile");
  return data;
}
