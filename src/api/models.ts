import { http } from "./http";
import { Model } from "../types/catalog";

export async function listModels(brandId?: number): Promise<Model[]> {
  const { data } = await http.get("/models", { params: brandId ? { brandId } : {} });
  return data;
}
