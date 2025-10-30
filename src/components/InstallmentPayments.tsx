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
    api.get(`/installment-payments/by-sale/${saleId}`).then((res) => {
      setPayments(res.data);
    });
  };

  const handleAdd = async () => {
    if (!installmentNumber || !paymentDate || !amountPaid) return;
    const formData = new FormData();
    formData.append("saleId", String(saleId));
    formData.append("installmentNumber", String(installmentNumber));
    formData.append("paymentDate", paymentDate);
    formData.append("amountPaid", String(amountPaid));
    if (receipt) formData.append("receipt", receipt);

    await api.post("/installment-payments/upload", formData, {
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
            <TableCell>Fecha</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Recibo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.installmentNumber}</TableCell>
              <TableCell>{p.paymentDate}</TableCell>
              <TableCell>${p.amountPaid}</TableCell>
              <TableCell>
                {p.receiptPath ? (
                  <a
                    href={`${api.defaults.baseURL}/${p.receiptPath}`}
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
