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

  const {
    data = [],
    total = 0,
    page,
    lastPage,
    limit,
  } = res.data || {};

  // Devolvés todo, pero con data/total siempre definidos
  return {
    data,
    total,
    page,
    lastPage,
    limit,
  };
}
