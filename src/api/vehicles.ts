import { http } from "./http";
import { Vehicle, VehicleListResponse } from "../types/vehicle";
import { showSuccess } from "../utils/errorHandler";

export type VehicleQuery = {
  brand?: string;
  model?: string;
  version?: string;
  color?: string;
  status?: string;
  plate?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "brand" | "model" | "year" | "price" | "status";
  sortOrder?: "ASC" | "DESC";
};

export async function listVehicles(params: VehicleQuery): Promise<VehicleListResponse> {
  // ✅ Garantizamos que page y limit siempre sean números válidos
  const query = {
    ...params,
    page: params.page && !isNaN(Number(params.page)) ? Number(params.page) : 1,
    limit: params.limit && !isNaN(Number(params.limit)) ? Number(params.limit) : 10,
  };

  const { data } = await http.get("/vehicles", { params: query });
  return data;
}

export async function createVehicle(
  payload: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Promise<Vehicle> {
  const { data } = await http.post("/vehicles", payload);
  showSuccess("✅ Vehículo creado correctamente");
  return data;
}

export async function updateVehicle(
  id: number,
  payload: Partial<Vehicle>
): Promise<Vehicle> {
  const { data } = await http.patch(`/vehicles/${id}`, payload);
  showSuccess("🚗 Vehículo actualizado con éxito");
  return data;
}

export async function deleteVehicle(id: number): Promise<{ id: number }> {
  const { data } = await http.delete(`/vehicles/${id}`);
  showSuccess("🗑️ Vehículo eliminado correctamente");
  return data;
}
