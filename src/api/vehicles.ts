import api from "./api";
import { Vehicle, VehicleListResponse } from "../types/vehicle";
import { showSuccess } from "../utils/errorHandler";

export type VehicleQuery = {
  // ✅ filtros por nombre (compatibilidad)
  brand?: string;
  model?: string;
  version?: string;

  // ✅ filtros por ID (los que usa tu Vehicles.tsx y tu backend)
  brandId?: number;
  modelId?: number;
  versionId?: number;

  color?: string;
  status?: string;
  plate?: string;

  // ✅ NUEVO: concesionaria
  concesionaria?: "DG" | "SyS" | string;

  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;

  q?: string;

  page?: number;
  limit?: number;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "brand"
    | "model"
    | "year"
    | "price"
    | "status";
  sortOrder?: "ASC" | "DESC";
};

export async function listVehicles(
  params: VehicleQuery
): Promise<VehicleListResponse> {
  // ✅ Normalizamos page/limit como antes
  const baseQuery: VehicleQuery = {
    ...params,
    page: params.page && !isNaN(Number(params.page)) ? Number(params.page) : 1,
    limit:
      params.limit && !isNaN(Number(params.limit)) ? Number(params.limit) : 10,
  };

  // ✅ Limpieza: no mandar undefined/null/""
  const query: Record<string, any> = {};
  Object.entries(baseQuery || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    query[k] = v;
  });

  const { data } = await api.get("/vehicles", { params: query });
  return data;
}

export async function createVehicle(
  payload: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Promise<Vehicle> {
  const { data } = await api.post("/vehicles", payload);
  showSuccess("✅ Vehículo creado correctamente");
  return data;
}

export async function updateVehicle(
  id: number,
  payload: Partial<Vehicle>
): Promise<Vehicle> {
  const { data } = await api.patch(`/vehicles/${id}`, payload);
  showSuccess("🚗 Vehículo actualizado con éxito");
  return data;
}

export async function deleteVehicle(id: number): Promise<{ id: number }> {
  const { data } = await api.delete(`/vehicles/${id}`);
  showSuccess("🗑️ Vehículo eliminado correctamente");
  return data;
}
