import axios from "axios";

const API_URL = "http://localhost:3001/vehicles";

export const getVehicles = async () => axios.get(API_URL);
export const createVehicle = async (data: any) => axios.post(API_URL, data);
export const updateVehicle = async (id: number, data: any) => axios.put(`${API_URL}/${id}`, data);
export const deleteVehicle = async (id: number) => axios.delete(`${API_URL}/${id}`);
