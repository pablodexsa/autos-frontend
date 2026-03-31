import api from "./api";

export type ListCuotaRedLeadsParams = {
  search?: string;
  status?: "pending" | "approved" | "rejected" | "error" | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export async function consultCuotaRed(payload: {
  dni: string;
  gender: "M" | "F";
}) {
  const { data } = await api.post("/cuotared/consult", payload);
  return data;
}

export async function listCuotaRedLeads(params: ListCuotaRedLeadsParams = {}) {
  const { data } = await api.get("/cuotared/leads", { params });
  return data;
}

export async function getCuotaRedLead(id: number) {
  const { data } = await api.get(`/cuotared/leads/${id}`);
  return data;
}

export async function updateCuotaRedLead(
  id: number,
  payload: { phone?: string; email?: string }
) {
  const { data } = await api.patch(`/cuotared/leads/${id}`, payload);
  return data;
}

export async function recheckCuotaRedLead(id: number) {
  const { data } = await api.post(`/cuotared/leads/${id}/recheck`);
  return data;
}

export async function deleteCuotaRedLead(id: number) {
  const { data } = await api.delete(`/cuotared/leads/${id}`);
  return data;
}