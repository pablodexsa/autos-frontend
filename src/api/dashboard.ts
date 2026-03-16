import { ManagerDashboardResponse } from "../types/dashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function getManagerDashboard(): Promise<ManagerDashboardResponse> {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/dashboard/manager`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "No se pudo obtener el dashboard gerencial");
  }

  return response.json();
}