import api from './api';
import { TreasuryAccount, TreasuryCategory, TreasuryCompany, TreasuryDashboard, TreasuryMovement, TreasuryMovementType } from '../types/treasury';

export const treasuryApi = {
  accounts: async (company?: TreasuryCompany) => (await api.get<TreasuryAccount[]>('/treasury/accounts', { params:{ company } })).data,
  createAccount: async (data:any) => (await api.post('/treasury/accounts', data)).data,
  updateAccount: async (id:number, data:any) => (await api.patch(`/treasury/accounts/${id}`, data)).data,
  categories: async (type?:TreasuryMovementType, company?:TreasuryCompany) => (await api.get<TreasuryCategory[]>('/treasury/categories', { params:{ type, company } })).data,
  createCategory: async (data:any) => (await api.post('/treasury/categories', data)).data,
  movements: async (params:any) => (await api.get<TreasuryMovement[]>('/treasury/movements', { params })).data,
  createMovement: async (data:any) => (await api.post<TreasuryMovement>('/treasury/movements', data)).data,
  transfer: async (data:any) => (await api.post<TreasuryMovement>('/treasury/transfers', data)).data,
  openingBalance: async (data:any) => (await api.post<TreasuryMovement>('/treasury/opening-balance', data)).data,
  voidMovement: async (id:number, reason:string) => (await api.post(`/treasury/movements/${id}/void`, { reason })).data,
  attach: async (id:number, file:File) => { const f=new FormData(); f.append('attachment', file); return (await api.post(`/treasury/movements/${id}/attachment`, f)).data; },
  dashboard: async (company?:TreasuryCompany, from?:string, to?:string) => (await api.get<TreasuryDashboard>('/treasury/dashboard', { params:{company,from,to} })).data,
};
