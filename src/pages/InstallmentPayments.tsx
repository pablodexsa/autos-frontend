import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { Delete, Add, AttachFile } from "@mui/icons-material";
import {
  listInstallmentPayments,
  createInstallmentPayment,
  deleteInstallmentPayment,
} from "../api/installmentPayments";
import "../styles/InstallmentPayments.css";

export default function InstallmentPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    installmentId: "",
    amount: "",
    paymentDate: "",
    file: null as File | null,
  });

  const fetchPayments = async () => {
    const data = await listInstallmentPayments();
    setPayments(data);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("installmentId", form.installmentId);
    formData.append("amount", form.amount);
    formData.append("paymentDate", form.paymentDate);
    if (form.file) formData.append("file", form.file);

    await createInstallmentPayment(formData);
    setOpen(false);
    setForm({ installmentId: "", amount: "", paymentDate: "", file: null });
    fetchPayments();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este pago?")) {
      await deleteInstallmentPayment(id);
      fetchPayments();
    }
  };

  return (
    <Box className="installment-payments-container">
      {/* Encabezado */}
      <Box className="header-section">
        <Typography variant="h5" sx={{ color: "#fff", fontWeight: 600 }}>
          Pagos de Cuotas
        </Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Registrar Pago
        </Button>
      </Box>

      {/* Tabla de pagos */}
      <Paper className="table-container">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Cuota</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Fecha de Pago</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.clientName}</TableCell>
                <TableCell>#{p.installmentId}</TableCell>
                <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(p.paymentDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {p.receiptPath ? (
                    <a
                      href={p.receiptPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      Ver archivo
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {p.isPaid ? "? Pagada" : "? Pendiente"}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(p.id)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal para registrar pago */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
          <TextField
            label="ID de Cuota"
            fullWidth
            margin="normal"
            value={form.installmentId}
            onChange={(e) =>
              setForm({ ...form, installmentId: e.target.value })
            }
          />
          <TextField
            label="Monto"
            type="number"
            fullWidth
            margin="normal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <TextField
            label="Fecha de Pago"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
          />

          <Button
            variant="outlined"
            component="label"
            startIcon={<AttachFile />}
            fullWidth
            sx={{ mt: 2 }}
          >
            Subir Comprobante
            <input
              type="file"
              hidden
              onChange={(e) =>
                setForm({ ...form, file: e.target.files?.[0] || null })
              }
            />
          </Button>

          {form.file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              ?? {form.file.name}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
