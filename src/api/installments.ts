import api from "./api";
import { showSuccess } from "../utils/errorHandler";

export async function listInstallments() {
  const { data } = await api.get("/installments");
  return data;
}

export async function markInstallmentPaid(id: number) {
  const { data } = await api.put(`/installments/${id}`, { paid: true });
  showSuccess("?? Cuota marcada como pagada");
  return data;
}
