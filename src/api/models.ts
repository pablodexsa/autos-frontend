import api from "./api";
import { Model } from "../types/catalog";

export async function listModels(brandId: number): Promise<Model[]> {
  const res = await api.get(`/brands/${brandId}/models`);
  return res.data;
}

// ✅ Nueva función para crear un modelo dentro de una marca
export async function createModel(brandId: number, data: { name: string }): Promise<Model> {
  const res = await api.post(`/brands/${brandId}/models`, data);
  return res.data;
}
