export type Brand = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Model = {
  id: number;
  name: string;
  brand: Brand;
  createdAt?: string;
  updatedAt?: string;
};

export type Version = {
  id: number;
  name: string;
  model: Model;
  createdAt?: string;
  updatedAt?: string;
};
