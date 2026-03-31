export type CuotaRedLead = {
  id: number;
  dni: string;
  gender: "M" | "F";
  status: "approved" | "rejected" | "pending" | "error";
  maxApprovedAmount: number | null;
  phone?: string;
  email?: string;
  statusMessage?: string;
  createdAt: string;
};