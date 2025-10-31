import api from "./api";
import { Brand } from "../types/catalog";

export async function listBrands(): Promise<Brand[]> {
  const { data } = await api.get("/brands");
  return data;
}
