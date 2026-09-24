export type TreasuryCompany = 'KAIROS' | 'GL_MOTORS';
export type TreasuryAccountType = 'CASH' | 'BANK' | 'WALLET' | 'OTHER';
export type TreasuryMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'OPENING_BALANCE' | 'ADJUSTMENT';
export type TreasuryMovementStatus = 'POSTED' | 'VOIDED';
export type TreasuryPaymentMethod = 'CASH' | 'TRANSFER' | 'DEBIT' | 'CREDIT' | 'CHECK' | 'WALLET' | 'OTHER';

export interface TreasuryAccount { id:number; name:string; company:TreasuryCompany; type:TreasuryAccountType; bankName?:string|null; accountNumber?:string|null; aliasCbu?:string|null; currency:string; notes?:string|null; isActive:boolean; }
export interface TreasuryCategory { id:number; name:string; movementType:TreasuryMovementType; company?:TreasuryCompany|null; parentId?:number|null; sortOrder:number; isActive:boolean; }
export interface TreasuryAllocation { id?:number; accountId:number; amount:number; paymentMethod?:TreasuryPaymentMethod; reference?:string|null; account?:TreasuryAccount; }
export interface TreasuryMovement { id:number; company?:TreasuryCompany|null; type:TreasuryMovementType; status:TreasuryMovementStatus; movementDate:string; totalAmount:number; description:string; counterparty?:string|null; reference?:string|null; attachmentPath?:string|null; allocations:TreasuryAllocation[]; voidReason?:string|null; }
export interface TreasuryBalance { accountId:number; accountName:string; company:TreasuryCompany; accountType:TreasuryAccountType; balance:number; }
export interface TreasuryDashboard { accounts:TreasuryBalance[]; total:number; income:number; expense:number; netFlow:number; }
