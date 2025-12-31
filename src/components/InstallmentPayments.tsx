import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Input,
} from "@mui/material";

export default function InstallmentPayments({ saleId }: { saleId: number }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [installmentNumber, setInstallmentNumber] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [receipt, setReceipt] = useState<File | null>(null);

  const load = () => {
api.get(`/installment-payments`).then((res) => {
  // si querés filtrar por saleId en el front:
  const filtered = (res.data ?? []).filter((p: any) => p.installment?.sale?.id === saleId);
  setPayments(filtered);
});
  };

const handleAdd = async () => {
  if (!installmentNumber || !paymentDate || !amountPaid) return;

  const formData = new FormData();

  // OJO: tu backend necesita installmentId, no "installmentNumber"
  // Acá tenés dos opciones:
  //   (1) Si "installmentNumber" en realidad es el ID de la cuota -> renombralo en UI
  //   (2) Si es el número (1..N), entonces necesitás un endpoint o resolver el id.
  //
  // Asumiendo (1): que el usuario carga el ID de la cuota:
  formData.append("installmentId", String(installmentNumber));

  formData.append("amount", String(amountPaid));
  formData.append("paymentDate", paymentDate);

  if (receipt) formData.append("file", receipt); // el backend intercepta "file"

  await api.post("/installment-payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  setInstallmentNumber(0);
  setPaymentDate("");
  setAmountPaid(0);
  setReceipt(null);
  load();
};


  useEffect(() => {
    load();
  }, [saleId]);

  return (
    <Box sx={{ p: 3 }}>
      <h2>Pagos de Cuotas</h2>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          type="number"
          label="Cuota N°"
          value={installmentNumber}
          onChange={(e) => setInstallmentNumber(Number(e.target.value))}
        />
        <TextField
          type="date"
          label="Fecha de Pago"
          InputLabelProps={{ shrink: true }}
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
        <TextField
          type="number"
          label="Monto Pagado"
          value={amountPaid}
          onChange={(e) => setAmountPaid(Number(e.target.value))}
        />
        <Input
          type="file"
          onChange={(e) => setReceipt(e.target.files?.[0] || null)}
        />
        <Button variant="contained" onClick={handleAdd}>
          Registrar
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cuota</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Recibo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.installment?.id ?? "-"}</TableCell>
<TableCell>
  {(() => {
    const c = p.client || p.installment?.client || p.installment?.sale?.client;
    return c ? `${c.firstName} ${c.lastName}` : "-";
  })()}
</TableCell>

              <TableCell>{p.paymentDate}</TableCell>
              <TableCell>${p.amount ?? "-"}</TableCell>
<TableCell>
  {p.receiptPath ? (
    <a
      href={`${api.defaults.baseURL}/installment-payments/${p.id}/receipt`}
      target="_blank"
      rel="noreferrer"
    >
      Ver
    </a>
  ) : (
    "-"
  )}
</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
