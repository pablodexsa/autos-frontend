import api from "./api";
import { Model } from "../types/catalog";

export async function listModels(brandId?: number): Promise<Model[]> {
  const { data } = await api.get("/models", { params: brandId ? { brandId } : {} });
  return data;
}
