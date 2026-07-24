import api from './api';

export type ProductSummary = {
  loanCount: number;
  activeLoanCount: number;
  principalPlaced: number;
  principalRecovered: number;
  principalOutstanding: number;
  interestCollected: number;
  lateFeesCollected: number;
};

export type FinancialDashboardSummary = {
  generatedAt: string;
  referenceDate: string;
  periods: Record<string, { from: string; to: string }>;
  boxes: { kairos: number; glMotors: number; management: number; logistics: number; total: number };
  portfolio: {
    totalLoans: number; activeLoans: number; principalPlaced: number;
    principalRecovered: number; principalOutstanding: number;
    interestCollected: number; expensesCollected: number; lateFeesCollected: number;
    overdueOutstanding: number; overdueInstallments: number;
  };
  collections: { today: number; week: number; month: number; todayCount: number; weekCount: number; monthCount: number };
  products: { kairosStandard: ProductSummary; glMotors: ProductSummary };
  weeklySeries: Array<{ from: string; to: string; collected: number; principal: number; interest: number; lateFees: number }>;
  overdue: Array<{ id: number; loanId: number; clientName: string; dueDate: string; remainingAmount: number; installmentNumber: number; totalInstallments: number; productType: string }>;
};

export async function getFinancialDashboardSummary(date?: string) {
  const { data } = await api.get<FinancialDashboardSummary>('/financial-dashboard/summary', {
    params: date ? { date } : undefined,
  });
  return data;
}
