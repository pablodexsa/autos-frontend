import api from "./api";
import { showSuccess } from "../utils/errorHandler";

export async function listInstallmentPayments() {
  const { data } = await api.get("/installment-payments");
  return data;
}

export async function createInstallmentPayment(formData: FormData) {
  const { data } = await api.post("/installment-payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  showSuccess("?? Pago registrado correctamente");
  return data;
}

export async function deleteInstallmentPayment(id: number) {
  const { data } = await api.delete(`/installment-payments/${id}`);
  showSuccess("??? Pago eliminado correctamente");
  return data;
}
