import api from "./api";

export const getRoles = async () => {
  const res = await api.get("/roles");
  return res.data;
};

export const createRole = async (name: string) => {
  const res = await api.post("/roles", { name });
  return res.data;
};

export const updateRole = async (id: number, name: string) => {
  const res = await api.patch(`/roles/${id}`, { name });
  return res.data;
};

export const deleteRole = async (id: number) => {
  const res = await api.delete(`/roles/${id}`);
  return res.data;
};
