import api from "./api";
import { showSuccess } from "../utils/errorHandler";

export async function listUsers() {
  const { data } = await api.get("/users");
  return data;
}

export async function createUser(payload: any) {
  const { data } = await api.post("/users", payload);
  showSuccess("?? Usuario creado correctamente");
  return data;
}

export async function updateUser(id: number, payload: any) {
  const { data } = await api.put(`/users/${id}`, payload);
  showSuccess("?? Usuario actualizado con éxito");
  return data;
}

export async function deleteUser(id: number) {
  const { data } = await api.delete(`/users/${id}`);
  showSuccess("??? Usuario eliminado correctamente");
  return data;
}
