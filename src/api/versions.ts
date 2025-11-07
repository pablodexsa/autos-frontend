import api from "./api";
import { Version } from "../types/catalog";

export async function listVersions(modelId: number): Promise<Version[]> {
  const res = await api.get(`/models/${modelId}/versions`);
  return res.data;
}

// ✅ Nueva función para crear una versión dentro de un modelo
export async function createVersion(modelId: number, data: { name: string }): Promise<Version> {
  const res = await api.post(`/models/${modelId}/versions`, data);
  return res.data;
}
