import { http } from "./http";
import { showSuccess } from "../utils/errorHandler";

export async function listClients() {
  const { data } = await http.get("/clients");
  return data;
}

export async function createClient(payload: any) {
  const { data } = await http.post("/clients", payload);
  showSuccess("?? Cliente agregado correctamente");
  return data;
}

export async function updateClient(id: number, payload: any) {
  const { data } = await http.put(`/clients/${id}`, payload);
  showSuccess("?? Cliente actualizado con éxito");
  return data;
}

export async function deleteClient(id: number) {
  const { data } = await http.delete(`/clients/${id}`);
  showSuccess("??? Cliente eliminado correctamente");
  return data;
}
