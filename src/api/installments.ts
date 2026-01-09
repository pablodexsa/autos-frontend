import api from "./api";
import { showSuccess } from "../utils/errorHandler";

// 👉 Obtiene todas las cuotas (con interés aplicado y labels x/y)
export async function listInstallments() {
  const { data } = await api.get("/installments");
  return data;
}

// 👉 Marca como pagada (forzado, sin monto) – queda por compatibilidad
export async function markInstallmentPaid(id: number) {
  const { data } = await api.patch(`/installments/${id}/pay`);
  showSuccess("💰 Cuota marcada como pagada");
  return data;
}

// 👉 NUEVO: Aplica pago total o parcial sobre una cuota
export async function registerInstallmentPayment(
  id: number,
  payload: {
    amount: number;
    paymentDate: string;
    receiver: "AGENCY" | "STUDIO";
    observations?: string;
  }
) {
  const { data } = await api.patch(
    `/installments/${id}/register-payment`,
    payload
  );
  showSuccess("💳 Pago aplicado a la cuota");
  return data;
}
