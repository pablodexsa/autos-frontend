import { http } from "./http";
import { Version } from "../types/catalog";

export async function listVersions(modelId?: number): Promise<Version[]> {
  const { data } = await http.get("/versions", { params: modelId ? { modelId } : {} });
  return data;
}
