import api from "./api";
import { Autocomplete } from "@mui/material";

export async function getJudicialPreview(clientId: number) {
  const { data } = await api.get(
    `/judicial-executions/preview/${clientId}`
  );
  return data;
}

export async function createJudicialExecution(payload: {
  clientId: number;
  lawFirmName?: string;
  notes?: string;
}) {
  const { data } = await api.post("/judicial-executions", payload);
  return data;
}

export async function searchClients(query: string) {
  const { data } = await api.get(`/clients?q=${query}`);
  return data;
}

export async function getJudicialExecutions(q?: string) {
  const { data } = await api.get("/judicial-executions", {
    params: { q },
  });
  return data;
}

export async function getJudicialExecutionById(id: number) {
  const { data } = await api.get(`/judicial-executions/${id}`);
  return data;
}

export async function closeJudicialExecution(id: number) {
  const { data } = await api.patch(`/judicial-executions/${id}/close`);
  return data;
}