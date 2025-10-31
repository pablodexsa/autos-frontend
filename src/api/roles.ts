import api from "./api";

// Listar roles (para selects en Usuarios)
export async function listRoles() {
  const { data } = await api.get("/roles");
  return data;
}
