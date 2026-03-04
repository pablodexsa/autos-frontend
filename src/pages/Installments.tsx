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
import { AttachFile, Visibility, CheckCircle } from "@mui/icons-material";
import { listInstallments, registerInstallmentPayment } from "../api/installments";
import { createInstallmentPayment } from "../api/installmentPayments";
import api from "../api/api";
import NotificationSnackbar from "../components/NotificationSnackbar";
import { formatDateAR } from "../utils/date";
import "../styles/Installments.css";

type Order = "asc" | "desc";

type StatusCode =
  | "PAID"
  | "PENDING"
  | "OVERDUE"
  | "PARTIAL"
  | "PARTIAL_OVERDUE";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  // 📌 Table state
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<
    "installmentLabel" | "client" | "vehiclePlate" | "amount" | "dueDate" | "status"
  >("dueDate");

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [filters, setFilters] = useState<{
    client: string;
    status: "" | StatusCode;
    dueDate: string; // "YYYY-MM-DD"
  }>({
    client: "",
    status: "",
    dueDate: "",
  });

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const data = await listInstallments();
      setInstallments(data || []);
    } catch (err) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Error cargando cuotas");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleOpenPayment = (installmentId: number) => {
    setSelectedInstallmentId(installmentId);
    setPaymentAmount("");
    setPaymentDate("");
    setReceiptFile(null);
    setOpenPaymentDialog(true);
  };

  const handleClosePayment = () => {
    setOpenPaymentDialog(false);
    setSelectedInstallmentId(null);
  };

  const handleOpenReceipt = async (paymentId: number) => {
    try {
      const res = await api.get(`/installment-payments/${paymentId}/receipt`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, "_blank");
    } catch (err) {
      setSnackbarSeverity("error");
      setSnackbarMessage("No se pudo abrir el comprobante");
      setSnackbarOpen(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInstallmentId) return;

    try {
      if (!paymentAmount || Number(paymentAmount) <= 0) {
        setSnackbarSeverity("warning");
        setSnackbarMessage("Ingresá un monto válido");
        setSnackbarOpen(true);
        return;
      }

      if (!paymentDate) {
        setSnackbarSeverity("warning");
        setSnackbarMessage("Ingresá una fecha de pago");
        setSnackbarOpen(true);
        return;
      }

      setLoading(true);

      const payload = {
        installmentId: selectedInstallmentId,
        amount: Number(paymentAmount),
        paymentDate,
      };

      let paymentId: number | null = null;

      // Si hay archivo, usar endpoint con multipart
      if (receiptFile) {
        const formData = new FormData();
        formData.append("amount", String(payload.amount));
        formData.append("paymentDate", payload.paymentDate);
        formData.append("receipt", receiptFile);

        const created = await createInstallmentPayment(selectedInstallmentId, formData);
        paymentId = created?.id ?? null;
      } else {
        const created = await registerInstallmentPayment(payload);
        paymentId = created?.id ?? null;
      }

      setSnackbarSeverity("success");
      setSnackbarMessage("Pago registrado correctamente");
      setSnackbarOpen(true);

      await fetchInstallments();
      handleClosePayment();
    } catch (err: any) {
      setSnackbarSeverity("error");
      setSnackbarMessage(err?.response?.data?.mensaje || "Error registrando pago");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (i: any) => {
    const c = i.client ?? i.sale?.client;
    if (!c) return "—";
    return `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—";
  };

  const getVehiclePlate = (i: any) => {
    return i.sale?.vehicle?.plate ?? i.vehicle?.plate ?? "—";
  };

  const isPartiallyPaid = (i: any) => {
    if (i.paid) return false;
    if (i.remainingAmount == null) return false;
    return Number(i.remainingAmount) < Number(i.amount);
  };

  // Helpers de fecha (evitan corrimiento por timezone)
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Devuelve "YYYY-MM-DD" sin pasar por Date() cuando viene string ISO
  const toISODate = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") {
      const s = value;
      // "2026-05-05" o "2026-05-05T00:00:00.000Z"
      return s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
    }
    if (value instanceof Date) {
      // Usa fecha local (lo que ve el usuario)
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }
    const s = String(value);
    return s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
  };

  // ✅ cálculo robusto de vencimiento (evita problemas de timezone)
  const isOverdueRow = (i: any) => {
    if (i.paid) return false;
    if (!i.dueDate) return false;

    const dueStr = toISODate(i.dueDate);
    const todayStr = toISODate(new Date());

    return !!dueStr && dueStr < todayStr;
  };

  // Código interno de estado para filtros y visualización
  const getStatusCode = (i: any): StatusCode => {
    if (i.paid) return "PAID";

    const partial = isPartiallyPaid(i);
    const overdue = isOverdueRow(i);

    if (partial && overdue) return "PARTIAL_OVERDUE";
    if (partial) return "PARTIAL";
    if (overdue) return "OVERDUE";

    return "PENDING";
  };

  const getStatusLabel = (i: any): string => {
    const code = getStatusCode(i);
    switch (code) {
      case "PAID":
        return "Pagada";
      case "PENDING":
        return "Pendiente";
      case "OVERDUE":
        return "Vencida";
      case "PARTIAL":
        return "Parcial";
      case "PARTIAL_OVERDUE":
        return "Parcial + Vencida";
      default:
        return "Pendiente";
    }
  };

  const compare = (a: any, b: any) => {
    let av: any;
    let bv: any;

    switch (orderBy) {
      case "installmentLabel":
        av = Number(String(a.installmentLabel ?? "").split("/")[0]) || 0;
        bv = Number(String(b.installmentLabel ?? "").split("/")[0]) || 0;
        break;
      case "client":
        av = getClientName(a).toLowerCase();
        bv = getClientName(b).toLowerCase();
        break;
      case "vehiclePlate":
        av = getVehiclePlate(a).toLowerCase();
        bv = getVehiclePlate(b).toLowerCase();
        break;
      case "amount":
        av = Number(a.currentAmount ?? a.amount ?? 0);
        bv = Number(b.currentAmount ?? b.amount ?? 0);
        break;
      case "dueDate":
        // Comparación lexicográfica funciona con YYYY-MM-DD
        av = toISODate(a.dueDate);
        bv = toISODate(b.dueDate);
        break;
      case "status":
        av = getStatusCode(a);
        bv = getStatusCode(b);
        break;
      default:
        av = 0;
        bv = 0;
    }

    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ? 1 : -1;
    return 0;
  };

  const handleRequestSort = (property: typeof orderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // ✅ Filtrado + Orden (antes de paginar)
  const filteredSorted = [...installments]
    .filter((i) => {
      const q = (filters.client || "").trim().toLowerCase();
      const name = getClientName(i).toLowerCase();
      const dni = String(i.client?.dni ?? i.sale?.client?.dni ?? "").toLowerCase();

      const matchesClient = !q || name.includes(q) || dni.includes(q);

      const statusCode = getStatusCode(i);
      const matchesStatus = !filters.status || statusCode === filters.status;

      const dueISO = toISODate(i.dueDate);
      const matchesDueDate = !filters.dueDate || dueISO === filters.dueDate;

      return matchesClient && matchesStatus && matchesDueDate;
    })
    .map((i) => ({
      ...i,
      installmentLabel: i.installmentLabel ?? "—",
    }))
    .sort(compare);

  const start = page * rowsPerPage + 1;
  const end = Math.min(start + rowsPerPage - 1, filteredSorted.length);

  const paginated = filteredSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="installments-container">
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: 600 }}>
        Cuotas
      </Typography>

      {/* Filtros */}
      <Paper
        sx={{
          p: 2,
          mt: 2,
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Cliente (nombre / DNI)"
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Estado"
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as "" | StatusCode,
                })
              }
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDING">Pendiente</MenuItem>
              <MenuItem value="OVERDUE">Vencida</MenuItem>
              <MenuItem value="PARTIAL">Parcial</MenuItem>
              <MenuItem value="PARTIAL_OVERDUE">Parcial + Vencida</MenuItem>
              <MenuItem value="PAID">Pagada</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Vencimiento"
              InputLabelProps={{ shrink: true }}
              value={filters.dueDate}
              onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper
        sx={{
          mt: 3,
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleRequestSort("installmentLabel")} sx={{ cursor: "pointer" }}>
                Cuota
              </TableCell>
              <TableCell onClick={() => handleRequestSort("client")} sx={{ cursor: "pointer" }}>
                Cliente
              </TableCell>
              <TableCell onClick={() => handleRequestSort("vehiclePlate")} sx={{ cursor: "pointer" }}>
                Vehículo
              </TableCell>
              <TableCell onClick={() => handleRequestSort("amount")} sx={{ cursor: "pointer" }}>
                Monto
              </TableCell>
              <TableCell onClick={() => handleRequestSort("dueDate")} sx={{ cursor: "pointer" }}>
                Vencimiento
              </TableCell>
              <TableCell onClick={() => handleRequestSort("status")} sx={{ cursor: "pointer" }}>
                Estado
              </TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ color: "#fff" }}>
                  {loading ? "Cargando..." : "No hay cuotas para mostrar"}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((i) => (
                <TableRow
                  key={i.id}
                  sx={
                    isOverdueRow(i)
                      ? {
                          "& td": {
                            color: "error.main",
                            fontWeight: 600,
                          },
                        }
                      : undefined
                  }
                >
                  <TableCell>{i.installmentLabel ?? "—"}</TableCell>
                  <TableCell>
                    {i.client ? `${i.client.firstName} ${i.client.lastName}` : "—"}
                  </TableCell>
                  <TableCell>{i.vehicle?.plate ?? "—"}</TableCell>
                  <TableCell>${Number(i.currentAmount ?? i.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{i.dueDate ? formatDateAR(i.dueDate) : "—"}</TableCell>
                  <TableCell>{getStatusLabel(i)}</TableCell>
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircle sx={{ color: "#2e7d32" }} />
                        <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                          Pagada
                        </Typography>
                      </Box>
                    ) : isPartiallyPaid(i) ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleOpenPayment(i.id)}
                      >
                        Abonar saldo
                      </Button>
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
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2 }}>
          <Typography variant="body2" sx={{ color: "#fff", py: 1 }}>
            Mostrando {filteredSorted.length === 0 ? 0 : start}–{filteredSorted.length === 0 ? 0 : end} de{" "}
            {filteredSorted.length}
          </Typography>

          <TablePagination
            component="div"
            count={filteredSorted.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Paper>

      {/* Dialog pago */}
      <Dialog open={openPaymentDialog} onClose={handleClosePayment} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Monto"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
            />
            <TextField
              label="Fecha de pago"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFile />}
              sx={{ justifyContent: "flex-start" }}
            >
              {receiptFile ? receiptFile.name : "Adjuntar comprobante (opcional)"}
              <input
                hidden
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayment} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePaymentSubmit} variant="contained" disabled={loading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationSnackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </Box>
  );
};

export default Installments;