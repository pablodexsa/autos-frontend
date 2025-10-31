import api from "./api";
import { showSuccess } from "../utils/errorHandler";

export async function listSales() {
  const { data } = await api.get("/sales");
  return data;
}

export async function createSale(payload: any) {
  const { data } = await api.post("/sales", payload);
  showSuccess("?? Venta registrada correctamente");
  return data;
}

export async function updateSale(id: number, payload: any) {
  const { data } = await api.put(`/sales/${id}`, payload);
  showSuccess("?? Venta actualizada con éxito");
  return data;
}

export async function deleteSale(id: number) {
  const { data } = await api.delete(`/sales/${id}`);
  showSuccess("??? Venta eliminada correctamente");
  return data;
}
