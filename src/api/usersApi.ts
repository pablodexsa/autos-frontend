import api from "./api";

export const getUsers = async () => (await api.get("/users")).data;
export const createUser = async (user: any) => (await api.post("/users", user)).data;
export const updateUser = async (id: number, user: any) => (await api.patch(`/users/${id}`, user)).data;
export const deleteUser = async (id: number) => (await api.delete(`/users/${id}`)).data;
