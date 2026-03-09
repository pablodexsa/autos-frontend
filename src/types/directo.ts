export type DirectoGender = "M" | "F";

export type DirectoLeadStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "error";

export type DirectoSaleType = "moto";

export interface DirectoLead {
  id: number;
  dni: string;
  gender: DirectoGender;
  saleType: DirectoSaleType;
  status: DirectoLeadStatus;
  fullName: string | null;
  maxApprovedAmount: number | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  observations: string | null;
  statusMessage: string | null;
  externalReference: string | null;
  rawResponse: any;
  validatedAt: string | null;
  requestedByUserId: number | null;
  clientId: number | null;
  budgetId: number | null;
  reservationId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultDirectoPayload {
  dni: string;
  gender: DirectoGender;
}

export interface ConsultDirectoResponse {
  id: number;
  success: boolean;
  status: DirectoLeadStatus;
  fullName: string | null;
  maxApprovedAmount: number | null;
  message: string | null;
  validatedAt: string | null;
}

export interface UpdateDirectoLeadPayload {
  dni?: string;
  gender?: DirectoGender;
  saleType?: DirectoSaleType;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  observations?: string;
}

export interface ListDirectoLeadsParams {
  search?: string;
  status?: DirectoLeadStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDirectoLeads {
  items: DirectoLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}