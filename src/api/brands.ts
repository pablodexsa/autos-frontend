import api from "./api";
import { Brand } from "../types/catalog";

export async function listBrands(): Promise<Brand[]> {
  const res = await api.get("/brands");
  return res.data;
}

// ✅ Nueva función para crear una marca
export async function createBrand(data: { name: string }): Promise<Brand> {
  const res = await api.post("/brands", data);
  return res.data;
}
