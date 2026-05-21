import api from './api';

export type LoanClient = {
  id: number;
  firstName: string;
  lastName: string;
  cuitCuil: string;
  workAddress?: string | null;
  aliasOrCbu?: string | null;
  dniPhotoPath?: string | null;
  businessPhotoPath?: string | null;
  serviceBillPath?: string | null;
  bankAccountPath?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Loan = {
  id: number;
  clientId: number;
  clientCuitCuil: string;
  clientName: string;
  requestedAmount: number;
  interestAmount: number;
  totalToReturn: number;
  installmentAmount: number;
  requestDate: string;
  weeklyInstallments: number;
  monthlyInterestRate: number;
  dailyLateInterestRate: number;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
};

export type LoanInstallment = {
  id: number;
  loanId: number;
  installmentLabel: string;
  amount: number;
  remainingAmount: number;
  paidAmount: number;
  currentAmount: number;
  paid: boolean;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  isOverdue: boolean;
  dueDate: string;
  lastPaymentAt?: string | null;
  paymentDate?: string | null;
  observations?: string | null;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    cuitCuil: string;
  } | null;
  loan?: {
    id: number;
    requestedAmount: number;
    totalToReturn: number;
    requestDate: string;
  } | null;
  payment?: any;
  payments?: any[];
};

export type LoanInstallmentPayment = {
  id: number;
  installmentId: number;
  loanId: number;
  clientId?: number | null;
  amount: number;
  paymentDate: string;
  isPaid: boolean;
  createdAt: string;
  installment?: any;
  loan?: any;
  client?: any;
};

export type LoanPreview = {
  client: {
    id: number;
    firstName: string;
    lastName: string;
    cuitCuil: string;
  };
  requestDate: string;
  requestedAmount: number;
  weeklyInstallments: number;
  monthlyInterestRate: number;
  dailyLateInterestRate: number;
  interestAmount: number;
  totalToReturn: number;
  installmentAmount: number;
  availableFund: number;
  canCreate: boolean;
  installments: {
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string;
  }[];
};

export type LoanFundSummary = {
  initialFund: number;
  availableFund: number;
  movements: any[];
};

export async function getLoanClients(params?: {
  q?: string;
  cuitCuil?: string;
  firstName?: string;
  lastName?: string;
  aliasOrCbu?: string;
}) {
  const { data } = await api.get<LoanClient[]>('/loan-clients', { params });
  return data;
}

export async function createLoanClient(payload: {
  firstName: string;
  lastName: string;
  cuitCuil: string;
  workAddress?: string;
  aliasOrCbu?: string;
}) {
  const { data } = await api.post<LoanClient>('/loan-clients', payload);
  return data;
}

export async function updateLoanClient(id: number, payload: Partial<LoanClient>) {
  const { data } = await api.put<LoanClient>(`/loan-clients/${id}`, payload);
  return data;
}

export async function deleteLoanClient(id: number) {
  const { data } = await api.delete(`/loan-clients/${id}`);
  return data;
}

export async function searchLoanClientByCuitCuil(cuitCuil: string) {
  const { data } = await api.get<LoanClient[]>(
    '/loan-clients/search/by-cuit-cuil',
    { params: { cuitCuil } },
  );
  return data;
}

export async function uploadLoanClientDocument(
  clientId: number,
  docType: 'dni' | 'business' | 'service_bill' | 'bank_account',
  file: File,
) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(
    `/loan-clients/${clientId}/documents/${docType}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export function getLoanClientDocumentUrl(
  clientId: number,
  docType: 'dni' | 'business' | 'service_bill' | 'bank_account',
) {
  return `${api.defaults.baseURL}/loan-clients/${clientId}/documents/${docType}`;
}

export async function previewLoan(payload: {
  clientCuitCuil: string;
  requestedAmount: number;
  requestDate: string;
  weeklyInstallments: number;
}) {
  const { data } = await api.post<LoanPreview>('/loans/preview', payload);
  return data;
}

export async function createLoan(payload: {
  clientCuitCuil: string;
  requestedAmount: number;
  requestDate: string;
  weeklyInstallments: number;
}) {
  const { data } = await api.post<Loan>('/loans', payload);
  return data;
}

export async function getLoans() {
  const { data } = await api.get<Loan[]>('/loans');
  return data;
}

export async function getLoanFundSummary() {
  const { data } = await api.get<LoanFundSummary>('/loans/fund-summary');
  return data;
}

export function getLoanPdfUrl(loanId: number) {
  return `${api.defaults.baseURL}/loans/${loanId}/pdf`;
}

export async function getLoanInstallments() {
  const { data } = await api.get<LoanInstallment[]>('/loan-installments');
  return data;
}

export async function registerLoanInstallmentPayment(
  installmentId: number,
  payload: {
    amount: number;
    paymentDate: string;
    observations?: string;
  },
) {
  const { data } = await api.patch(
    `/loan-installments/${installmentId}/register-payment`,
    payload,
  );
  return data;
}

export async function getLoanInstallmentPayments() {
  const { data } = await api.get<LoanInstallmentPayment[]>(
    '/loan-installment-payments',
  );
  return data;
}

export function getLoanPaymentReceiptUrl(paymentId: number) {
  return `${api.defaults.baseURL}/loan-installment-payments/${paymentId}/receipt`;
}