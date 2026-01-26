import api from "./api";

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// 🔹 Obtener todos los roles (incluye ahora "legales")
export const getRoles = async (): Promise<Role[]> => {
  const res = await api.get<Role[]>("/roles");
  return res.data;
};

// 🔹 Crear rol (aunque no uses UI, lo dejamos por compatibilidad)
export const createRole = async (name: string): Promise<Role> => {
  const res = await api.post<Role>("/roles", { name });
  return res.data;
};

// 🔹 Actualizar rol
export const updateRole = async (id: number, name: string): Promise<Role> => {
  const res = await api.patch<Role>(`/roles/${id}`, { name });
  return res.data;
};

// 🔹 Eliminar rol
export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`/roles/${id}`);
};
