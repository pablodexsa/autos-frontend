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
  MenuItem,
  Grid,
  TablePagination,
} from "@mui/material";
import { Delete, AttachFile, Visibility } from "@mui/icons-material";
import { listInstallments, markInstallmentPaid } from "../api/installments";
import {
  createInstallmentPayment,
  deleteInstallmentPayment,
} from "../api/installmentPayments";
import api from "../api/api";
import NotificationSnackbar from "../components/NotificationSnackbar";
import "../styles/Installments.css";

export default function Installments() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(
    null
  );
  const [form, setForm] = useState({
    amount: "",
    paymentDate: "",
    file: null as File | null,
  });

  const [filters, setFilters] = useState({
    client: "",
    status: "",
    dueDate: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ?? Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => setSnackbar({ open: true, message, severity });

  const handleCloseSnackbar = () =>
    setSnackbar({ ...snackbar, open: false, message: "" });

  const fetchInstallments = async () => {
    const data = await listInstallments();
    setInstallments(data);
    setFiltered(data);
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleOpenPayment = (installmentId: number) => {
    setSelectedInstallment(installmentId);
    setOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInstallment) return;
    try {
      const formData = new FormData();
      formData.append("installmentId", String(selectedInstallment));
      formData.append("amount", form.amount);
      formData.append("paymentDate", form.paymentDate);
      if (form.file) formData.append("file", form.file);

      await createInstallmentPayment(formData);
      await markInstallmentPaid(selectedInstallment);
      setOpen(false);
      setForm({ amount: "", paymentDate: "", file: null });
      fetchInstallments();
      showSnackbar("? Pago registrado con éxito", "success");
    } catch {
      showSnackbar("? Error al registrar el pago", "error");
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este pago?")) {
      try {
        await deleteInstallmentPayment(id);
        fetchInstallments();
        showSnackbar("??? Pago eliminado correctamente", "success");
      } catch {
        showSnackbar("? Error al eliminar el pago", "error");
      }
    }
  };

  const handleOpenReceipt = async (paymentId: number) => {
    try {
      const response = await api.get(`/installment-payments/${paymentId}/receipt`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      showSnackbar("?? No se pudo abrir el comprobante", "warning");
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const start = page * rowsPerPage + 1;
  const end = Math.min(start + rowsPerPage - 1, filtered.length);

  return (
    <Box className="installments-container">
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: 600 }}>
        Cuotas
      </Typography>

      {/* Tabla */}
      <Paper className="table-container" sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.id}</TableCell>
                  <TableCell>{i.client?.name || "—"}</TableCell>
                  <TableCell>${Number(i.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{i.paid ? "? Pagada" : "? Pendiente"}</TableCell>
                  <TableCell>
                    {i.payment?.id ? (
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenReceipt(i.payment.id)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {i.paid ? (
                      <IconButton
                        color="error"
                        onClick={() => handleDeletePayment(i.payment?.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleOpenPayment(i.id)}
                      >
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1 }}
        >
          <Typography variant="body2" color="#ccc">
            Mostrando {start}-{end} de {filtered.length} cuotas
          </Typography>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página"
          />
        </Box>
      </Paper>

      {/* Modal de pago */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
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
          <Button onClick={handleSubmitPayment} variant="contained" color="success">
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* ?? Snackbar */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
}
