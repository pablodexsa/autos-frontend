import { http } from "./http";
import { showSuccess } from "../utils/errorHandler";

export async function listBudgets() {
  const { data } = await http.get("/budgets");
  return data;
}

export async function createBudget(payload: any) {
  const { data } = await http.post("/budgets", payload);
  showSuccess("?? Presupuesto creado correctamente");
  return data;
}

export async function updateBudget(id: number, payload: any) {
  const { data } = await http.put(`/budgets/${id}`, payload);
  showSuccess("?? Presupuesto actualizado con éxito");
  return data;
}

export async function deleteBudget(id: number) {
  const { data } = await http.delete(`/budgets/${id}`);
  showSuccess("??? Presupuesto eliminado correctamente");
  return data;
}
