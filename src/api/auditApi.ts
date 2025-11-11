import api from "./api";

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: number | "";
  action?: string;
  module?: string;
  search?: string;
  from?: string;
  to?: string;
} = {}) {
  const res = await api.get("/audit", { params });
  return res.data; // { data, total, page, lastPage, limit }
}
