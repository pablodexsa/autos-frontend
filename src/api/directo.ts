import api from "./api";
import {
  ConsultDirectoPayload,
  ConsultDirectoResponse,
  DirectoLead,
  ListDirectoLeadsParams,
  PaginatedDirectoLeads,
  UpdateDirectoLeadPayload,
} from "../types/directo";

export async function consultDirecto(
  payload: ConsultDirectoPayload
): Promise<ConsultDirectoResponse> {
  const { data } = await api.post("/directo/consult", payload);
  return data;
}

export async function listDirectoLeads(
  params: ListDirectoLeadsParams
): Promise<PaginatedDirectoLeads> {
  const { data } = await api.get("/directo/leads", { params });
  return data;
}

export async function getDirectoLead(id: number): Promise<DirectoLead> {
  const { data } = await api.get(`/directo/leads/${id}`);
  return data;
}

export async function updateDirectoLead(
  id: number,
  payload: UpdateDirectoLeadPayload
): Promise<DirectoLead> {
  const { data } = await api.patch(`/directo/leads/${id}`, payload);
  return data;
}

export async function recheckDirectoLead(id: number) {
  const { data } = await api.post(`/directo/leads/${id}/recheck`);
  return data;
}

export async function deleteDirectoLead(id: number) {
  const { data } = await api.delete(`/directo/leads/${id}`);
  return data;
}