import { http } from "./http";
import { Brand } from "../types/catalog";

export async function listBrands(): Promise<Brand[]> {
  const { data } = await http.get("/brands");
  return data;
}
