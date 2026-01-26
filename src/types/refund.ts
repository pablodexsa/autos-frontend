export type RefundStatus = 'PENDING' | 'DELIVERED';

export type RefundRow = {
  id: number;
  reservationId: number;
  clientDni: string;
  plate: string;
  vehicleLabel: string;
  canceledAt: string; // ISO
  status: RefundStatus;
  expectedAmount: number;
  paidAmount: number | null;
  deliveredAt: string | null;
  deliveredByUserId: number | null;
  deliveredByUser: any | null; // si tenés tipado de User, reemplazalo
};
