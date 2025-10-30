import { http } from "./http";

// Listar roles (para selects en Usuarios)
export async function listRoles() {
  const { data } = await http.get("/roles");
  return data;
}
