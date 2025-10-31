import api from "./api";
import { Version } from "../types/catalog";

export async function listVersions(modelId?: number): Promise<Version[]> {
  const { data } = await api.get("/versions", { params: modelId ? { modelId } : {} });
  return data;
}
