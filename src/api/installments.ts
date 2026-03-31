import api from "./api";
import { showSuccess } from "../utils/errorHandler";

export async function listInstallments() {
  const { data } = await api.get("/installments");
  return data;
}

export async function markInstallmentPaid(id: number) {
  const { data } = await api.patch(`/installments/${id}/pay`);
  showSuccess("Cuota marcada como pagada");
  return data;
}

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

  return data;
}