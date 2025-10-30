// pages/sales/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../../api";
import InstallmentPayments from "../../components/InstallmentPayments";
import { Box, Typography } from "@mui/material";

export default function SaleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [sale, setSale] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.get(`/sales/${id}`).then((res) => setSale(res.data));
    }
  }, [id]);

  if (!sale) return <div>Cargando...</div>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Detalle de Venta
      </Typography>
      <Typography variant="subtitle1">
        Vehículo: {sale.vehicle?.brand} {sale.vehicle?.model} ({sale.vehicle?.year})
      </Typography>
      <Typography variant="subtitle1">
        Tipo de Venta: {sale.saleType}
      </Typography>
      <Typography variant="subtitle1">
        Precio: ${Number(sale.price).toFixed(2)}
      </Typography>
      {sale.downPayment && (
        <Typography variant="subtitle1">
          Anticipo: ${Number(sale.downPayment).toFixed(2)}
        </Typography>
      )}
      {sale.installments && (
        <Typography variant="subtitle1">
          Cuotas: {sale.installments} × ${Number(sale.installmentValue).toFixed(2)}
        </Typography>
      )}

      {/* Aquí mostramos el registro de pagos */}
      <InstallmentPayments saleId={Number(id)} />
    </Box>
  );
}
