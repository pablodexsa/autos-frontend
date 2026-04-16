export interface ManagerDashboardSummary {
  monthlySalesCount: number;
  monthlySalesAmount: number;
  monthlyCollectedInstallmentsCount: number;
  monthlyCollectedInstallmentsAmount: number;
  monthlyExpensesCount: number;
  monthlyExpensesAmount: number;
  monthlyNetAmount: number;
  pendingInstallmentsCount: number;
  pendingInstallmentsAmount: number;
  overdueInstallmentsCount: number;
  overdueInstallmentsAmount: number;
  notYetDueInstallmentsCount: number;
  notYetDueInstallmentsAmount: number;
  receivablesBacklogAmount: number;
judicialInstallmentsCount: number;
judicialClientsCount: number;
judicialAmount: number;
}

export interface DashboardMonthlySeries {
  month: string;
  count: number;
  amount: number;
}

export interface DashboardInstallmentsByDueMonth {
  month: string;
  dueAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  unpaidCount: number;
}

export interface DashboardAging {
  bucket: string;
  count: number;
  amount: number;
}

export interface DashboardInstallmentItem {
  id: number;
  installmentNumber: number | null;
  dueDate: string | null;
  amount: number;
  remainingAmount: number;
  status: string | null;
  receiver: string | null;
  daysOverdue?: number;
}

export interface DashboardCashflow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ManagerDashboardResponse {
  summary: ManagerDashboardSummary;
  monthlySales: DashboardMonthlySeries[];
  monthlyCollections: DashboardMonthlySeries[];
  monthlyExpenses: DashboardMonthlySeries[];
  monthlyCashflow: DashboardCashflow[];
  installmentsByDueMonth: DashboardInstallmentsByDueMonth[];
  receivablesAging: DashboardAging[];
  topOverdueInstallments: DashboardInstallmentItem[];
  upcomingInstallments: DashboardInstallmentItem[];
}