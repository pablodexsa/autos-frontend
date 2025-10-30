import { http } from "./http";
import { showSuccess } from "../utils/errorHandler";

export async function listUsers() {
  const { data } = await http.get("/users");
  return data;
}

export async function createUser(payload: any) {
  const { data } = await http.post("/users", payload);
  showSuccess("?? Usuario creado correctamente");
  return data;
}

export async function updateUser(id: number, payload: any) {
  const { data } = await http.put(`/users/${id}`, payload);
  showSuccess("?? Usuario actualizado con éxito");
  return data;
}

export async function deleteUser(id: number) {
  const { data } = await http.delete(`/users/${id}`);
  showSuccess("??? Usuario eliminado correctamente");
  return data;
}
