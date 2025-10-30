export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  version: string;
  year: number;
  plate: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  price: number;
  status: 'available' | 'reserved' | 'sold' | string;
  createdAt?: string;
  updatedAt?: string;
};

export type VehicleListResponse = {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
