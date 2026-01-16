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
  Grid,
  MenuItem,
} from "@mui/material";
import { Add, AttachFile, Visibility } from "@mui/icons-material";
import {
  listInstallmentPayments,
  createInstallmentPayment,
} from "../api/installmentPayments";
import "../styles/InstallmentPayments.css";
import { API_URL } from "../config";
import api from "../api/api";

export default function InstallmentPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    installmentId: "",
    amount: "",
    paymentDate: "",
    file: null as File | null,
  });

  // Filtros
  const [filters, setFilters] = useState({
    client: "",
    fromDate: "",
    toDate: "",
    receiver: "",
  });

  // Dialog de observaciones
  const [obsOpen, setObsOpen] = useState(false);
  const [selectedObs, setSelectedObs] = useState<string | null>(null);

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

  // 👉 Helper para formatear fecha sin corrimiento de día
  const formatDate = (value: any) => {
    if (!value) return "—";
    const iso = new Date(value).toISOString().slice(0, 10); // YYYY-MM-DD
    const [y, m, d] = iso.split("-");
    return `${Number(d)}/${Number(m)}/${y}`;
  };

  // Abrir comprobante PDF del sistema
  const handleOpenSystemReceipt = async (paymentId: number) => {
    try {
      const response = await api.get(
        `/installment-payments/${paymentId}/receipt`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      alert("No se pudo abrir el comprobante de pago");
    }
  };

  // Abrir adjunto original
  const handleOpenAttachment = (paymentId: number) => {
    const url = `${API_URL}/installment-payments/${paymentId}/attachment`;
    window.open(url, "_blank");
  };

  const getClientName = (p: any) => {
    const c =
      p.client ||
      p.installment?.client ||
      p.installment?.sale?.client ||
      null;
    if (!c) return "—";
    const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
    return full || "—";
  };

  const getClientDni = (p: any) => {
    const c =
      p.client ||
      p.installment?.client ||
      p.installment?.sale?.client ||
      null;
    return c?.dni ? String(c.dni) : "";
  };

const getVehiclePlate = (p: any) => {
  return (
    p.installment?.sale?.vehicle?.plate ??
    "—"
  );
};

  const getInstallmentLabel = (p: any) => {
    const inst = p.installment;

    // 1) Si viene numeración en la cuota, la usamos
    if (inst?.installmentNumber && inst?.totalInstallments) {
      return `${inst.installmentNumber}/${inst.totalInstallments}`;
    }

    // 2) Si viene arreglo de cuotas en la venta, calculamos X/Y
    if (inst?.sale?.installments?.length) {
      const ordered = [...inst.sale.installments].sort(
        (a: any, b: any) =>
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime()
      );
      const idx = ordered.findIndex((x: any) => x.id === inst.id);
      if (idx >= 0) {
        return `${idx + 1}/${ordered.length}`;
      }
    }

    // 3) Si el backend manda label ya calculada, la respetamos
    if (p.installmentLabel) return p.installmentLabel;

    // 4) Fallback: #id
    if (inst?.id) return `#${inst.id}`;
    if (p.installmentId) return `#${p.installmentId}`;
    return "—";
  };

  const handleOpenObs = (text: string) => {
    setSelectedObs(text);
    setObsOpen(true);
  };

  // 🔍 Aplicar filtros en memoria
  const filteredPayments = payments.filter((p) => {
    const q = (filters.client || "").trim().toLowerCase();
    const name = getClientName(p).toLowerCase();
    const dni = getClientDni(p).toLowerCase();

    const matchesClient =
      !q || name.includes(q) || dni.includes(q);

    // Fecha de pago en formato YYYY-MM-DD (para comparar con filtros)
    const payIso = p.paymentDate
      ? new Date(p.paymentDate).toISOString().slice(0, 10)
      : "";

    let matchesFrom = true;
    let matchesTo = true;

    if (filters.fromDate) {
      matchesFrom = payIso >= filters.fromDate;
    }
    if (filters.toDate) {
      matchesTo = payIso <= filters.toDate;
    }

    const rec = p.installment?.receiver || "";
    const matchesReceiver =
      !filters.receiver || rec === filters.receiver;

    return matchesClient && matchesFrom && matchesTo && matchesReceiver;
  });

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

      {/* Panel de filtros */}
      <Paper
        sx={{
          p: 2,
          mt: 2,
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cliente (nombre / DNI)"
              value={filters.client}
              onChange={(e) =>
                setFilters({ ...filters, client: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              fullWidth
              label="Fecha desde"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              fullWidth
              label="Fecha hasta"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate}
              onChange={(e) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Recibe"
              value={filters.receiver}
              onChange={(e) =>
                setFilters({ ...filters, receiver: e.target.value })
              }
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="AGENCY">Agencia</MenuItem>
              <MenuItem value="STUDIO">Estudio</MenuItem>
            </TextField>
          </Grid>

          <Grid
            item
            xs={12}
            md={12}
            sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
          >
            <Button
              variant="outlined"
              onClick={() =>
                setFilters({
                  client: "",
                  fromDate: "",
                  toDate: "",
                  receiver: "",
                })
              }
            >
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de pagos */}
      <Paper className="table-container" sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Cuota</TableCell>
              <TableCell>Patente</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Fecha de Pago</TableCell>
              <TableCell>Recibe</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell>Comprobante</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>

                <TableCell>{getClientName(p)}</TableCell>

                <TableCell>{getInstallmentLabel(p)}</TableCell>

                <TableCell>{getVehiclePlate(p)}</TableCell> {/* 👈 NUEVA */}

                <TableCell>
                  $
                  {Number(p.amount).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>

                <TableCell>{formatDate(p.paymentDate)}</TableCell>

                <TableCell>
                  {p.installment?.receiver === "AGENCY"
                    ? "Agencia"
                    : p.installment?.receiver === "STUDIO"
                    ? "Estudio"
                    : "—"}
                </TableCell>

                <TableCell>
                  {p.installment?.observations ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        handleOpenObs(p.installment.observations)
                      }
                    >
                      Ver
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell>
                  {/* Comprobante del sistema */}
                  <IconButton
                    size="small"
                    onClick={() => handleOpenSystemReceipt(p.id)}
                    title="Ver comprobante de pago"
                  >
                    <Visibility />
                  </IconButton>

                  {/* Archivo adjunto (si existe) */}
                  {p.receiptPath && (
                    <Button
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => handleOpenAttachment(p.id)}
                    >
                      Adjunto
                    </Button>
                  )}
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
              📎 {form.file.name}
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

      {/* Dialog de Observaciones */}
      <Dialog
        open={obsOpen}
        onClose={() => setObsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Observaciones</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {selectedObs}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
