// src/services/vehicles.service.ts
import api from "../api/api"; // ajustá la ruta si es distinta

export const getVehicles = async () => {
  const { data } = await api.get("/vehicles");
  return data;
};

export const createVehicle = async (data: any) => {
  const { data: res } = await api.post("/vehicles", data);
  return res;
};

export const updateVehicle = async (id: number, data: any) => {
  const { data: res } = await api.put(`/vehicles/${id}`, data);
  return res;
};

export const deleteVehicle = async (id: number) => {
  const { data: res } = await api.delete(`/vehicles/${id}`);
  return res;
};
