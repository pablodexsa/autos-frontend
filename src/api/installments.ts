import { http } from "./http";
import { showSuccess } from "../utils/errorHandler";

export async function listInstallments() {
  const { data } = await http.get("/installments");
  return data;
}

export async function markInstallmentPaid(id: number) {
  const { data } = await http.put(`/installments/${id}`, { paid: true });
  showSuccess("?? Cuota marcada como pagada");
  return data;
}
