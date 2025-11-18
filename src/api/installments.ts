import api from "./api";
import { showSuccess } from "../utils/errorHandler";

// 👉 Obtiene todas las cuotas (con relaciones si están en el backend)
export async function listInstallments() {
  const { data } = await api.get("/installments");
  return data;
}

// 👉 Marca como pagada usando el endpoint REAL del backend
export async function markInstallmentPaid(id: number) {
  const { data } = await api.patch(`/installments/${id}/pay`);
  showSuccess("💰 Cuota marcada como pagada");
  return data;
}
