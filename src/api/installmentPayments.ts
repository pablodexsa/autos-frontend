import { http } from "./http";
import { showSuccess } from "../utils/errorHandler";

export async function listInstallmentPayments() {
  const { data } = await http.get("/installment-payments");
  return data;
}

export async function createInstallmentPayment(formData: FormData) {
  const { data } = await http.post("/installment-payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  showSuccess("?? Pago registrado correctamente");
  return data;
}

export async function deleteInstallmentPayment(id: number) {
  const { data } = await http.delete(`/installment-payments/${id}`);
  showSuccess("??? Pago eliminado correctamente");
  return data;
}
