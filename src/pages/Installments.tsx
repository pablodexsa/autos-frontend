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
import { Visibility, CheckCircle } from "@mui/icons-material";
import {
  listInstallments,
  registerInstallmentPayment,
} from "../api/installments";
import api from "../api/api";
import NotificationSnackbar from "../components/NotificationSnackbar";
import { formatDateAR } from "../utils/date";
import "../styles/Installments.css";
import LoadingActionButton from "../components/LoadingActionButton";

type Order = "asc" | "desc";

type StatusCode =
  | "PAID"
  | "PENDING"
  | "OVERDUE"
  | "PARTIAL"
  | "PARTIAL_OVERDUE";

type SnackbarSeverity = "success" | "error" | "warning" | "info";
type PaymentReceiver = "AGENCY" | "STUDIO";

const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [savingPayment, setSavingPayment] = useState(false);

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(
    null
  );

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentReceiver, setPaymentReceiver] =
    useState<PaymentReceiver>("AGENCY");
  const [paymentObservations, setPaymentObservations] = useState<string>("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<SnackbarSeverity>("success");

  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<
    | "installmentLabel"
    | "client"
    | "vehiclePlate"
    | "concept"
    | "originalAmount"
    | "remainingAmount"
    | "paidAmount"
    | "dueDate"
    | "status"
  >("dueDate");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState<{
    client: string;
    status: "" | StatusCode;
    dueDate: string;
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
    setPaymentReceiver("AGENCY");
    setPaymentObservations("");
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
  if (selectedInstallmentId == null || savingPayment) return;

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

    setSavingPayment(true);

    await registerInstallmentPayment(selectedInstallmentId, {
      amount: Number(paymentAmount),
      paymentDate,
      receiver: paymentReceiver,
      observations: paymentObservations.trim() || undefined,
    });

    setSnackbarSeverity("success");
    setSnackbarMessage("Pago registrado correctamente");
    setSnackbarOpen(true);

    await fetchInstallments();
    handleClosePayment();
  } catch (err: any) {
    console.error("Error registrando pago:", err?.response?.data || err);
    setSnackbarSeverity("error");
    setSnackbarMessage(
      err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        "Error registrando pago"
    );
    setSnackbarOpen(true);
  } finally {
    setSavingPayment(false);
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

  const getPaymentId = (i: any): number | null => {
    if (i.payment?.id) return i.payment.id;
    if (i.lastPayment?.id) return i.lastPayment.id;
    if (i.installmentPayment?.id) return i.installmentPayment.id;
    if (Array.isArray(i.payments) && i.payments.length > 0) {
      const sorted = [...i.payments].sort((a, b) => Number(b.id) - Number(a.id));
      return sorted[0]?.id ?? null;
    }
    return null;
  };

  const getOriginalAmount = (i: any) => Number(i.amount ?? 0);

  const getRemainingAmount = (i: any) => {
    if (isOverdueRow(i) && !i.paid) {
      return Number(i.currentAmount ?? i.remainingAmount ?? i.amount ?? 0);
    }

    return Number(i.remainingAmount ?? i.amount ?? 0);
  };

  const getPaidAmount = (i: any) => {
    const original = getOriginalAmount(i);
    const remainingRaw = i.remainingAmount;
    const remaining = remainingRaw != null ? Number(remainingRaw) : original;

    return Math.max(original - remaining, 0);
  };

  const isPartiallyPaid = (i: any) => {
    if (i.paid) return false;
    if (i.remainingAmount == null) return false;
    return Number(i.remainingAmount) < Number(i.amount);
  };

  const labelInstallmentConcept = (concept?: string | null) => {
    switch (concept) {
      case "PERSONAL_FINANCING":
        return "Financiación Personal";
      case "MOTO_PLAN":
        return "Plan Motos";
      default:
        return concept || "-";
    }
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const toISODate = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") {
      const s = value;
      return s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
    }
    if (value instanceof Date) {
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
        value.getDate()
      )}`;
    }
    const s = String(value);
    return s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
  };

  const isOverdueRow = (i: any) => {
    if (i.paid) return false;
    if (!i.dueDate) return false;

    const dueStr = toISODate(i.dueDate);
    const todayStr = toISODate(new Date());

    return !!dueStr && dueStr < todayStr;
  };

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
      case "concept":
        av = labelInstallmentConcept(a.concept).toLowerCase();
        bv = labelInstallmentConcept(b.concept).toLowerCase();
        break;
      case "originalAmount":
        av = getOriginalAmount(a);
        bv = getOriginalAmount(b);
        break;
      case "remainingAmount":
        av = getRemainingAmount(a);
        bv = getRemainingAmount(b);
        break;
      case "paidAmount":
        av = getPaidAmount(a);
        bv = getPaidAmount(b);
        break;
      case "dueDate":
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

  const filteredSorted = [...installments]
    .filter((i) => {
      const q = (filters.client || "").trim().toLowerCase();
      const name = getClientName(i).toLowerCase();
      const dni = String(i.client?.dni ?? i.sale?.client?.dni ?? "").toLowerCase();

      const matchesClient = !q || name.includes(q) || dni.includes(q);

const statusCode = getStatusCode(i);
const matchesStatus = filters.status
  ? statusCode === filters.status
  : statusCode !== "PAID";

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

  const paginated = filteredSorted.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box className="installments-container">
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: 600 }}>
        Cuotas
      </Typography>

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
              <TableCell
                onClick={() => handleRequestSort("installmentLabel")}
                sx={{ cursor: "pointer" }}
              >
                Cuota
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("client")}
                sx={{ cursor: "pointer" }}
              >
                Cliente
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("vehiclePlate")}
                sx={{ cursor: "pointer" }}
              >
                Vehículo
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("concept")}
                sx={{ cursor: "pointer" }}
              >
                Concepto
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("originalAmount")}
                sx={{ cursor: "pointer" }}
              >
                Monto original
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("remainingAmount")}
                sx={{ cursor: "pointer" }}
              >
                Saldo pendiente
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("paidAmount")}
                sx={{ cursor: "pointer" }}
              >
                Pagado
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("dueDate")}
                sx={{ cursor: "pointer" }}
              >
                Vencimiento
              </TableCell>
              <TableCell
                onClick={() => handleRequestSort("status")}
                sx={{ cursor: "pointer" }}
              >
                Estado
              </TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} sx={{ color: "#fff" }}>
                  {loading ? "Cargando..." : "No hay cuotas para mostrar"}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((i) => {
                const paymentId = getPaymentId(i);

                return (
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
                    <TableCell>{labelInstallmentConcept(i.concept)}</TableCell>
                    <TableCell>${getOriginalAmount(i).toLocaleString()}</TableCell>
                    <TableCell>${getRemainingAmount(i).toLocaleString()}</TableCell>
                    <TableCell>${getPaidAmount(i).toLocaleString()}</TableCell>
                    <TableCell>{i.dueDate ? formatDateAR(i.dueDate) : "—"}</TableCell>
                    <TableCell>{getStatusLabel(i)}</TableCell>
                    <TableCell>
                      {paymentId ? (
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenReceipt(paymentId)}
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
                          <Typography
                            variant="body2"
                            sx={{ color: "#2e7d32", fontWeight: 600 }}
                          >
                            Pagada
                          </Typography>
                        </Box>
                      ) : isPartiallyPaid(i) ? (
<Button
  size="small"
  variant="contained"
  color="warning"
  onClick={() => handleOpenPayment(i.id)}
  disabled={savingPayment}
>
  Abonar saldo
</Button>
                      ) : (
<Button
  size="small"
  variant="contained"
  color="success"
  onClick={() => handleOpenPayment(i.id)}
  disabled={savingPayment}
>
  Pagar
</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#fff", py: 1 }}>
            Mostrando {filteredSorted.length === 0 ? 0 : start}–
            {filteredSorted.length === 0 ? 0 : end} de {filteredSorted.length}
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

      <Dialog
        open={openPaymentDialog}
        onClose={handleClosePayment}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Monto"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              disabled={savingPayment}
            />

            <TextField
              label="Fecha de pago"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={savingPayment}
            />

            <TextField
              select
              label="Quién recibe el dinero"
              value={paymentReceiver}
              onChange={(e) =>
                setPaymentReceiver(e.target.value as PaymentReceiver)
              }
              fullWidth
              disabled={savingPayment}
            >
              <MenuItem value="AGENCY">Agencia</MenuItem>
              <MenuItem value="STUDIO">Estudio</MenuItem>
            </TextField>

            <TextField
              label="Observaciones"
              value={paymentObservations}
              onChange={(e) => setPaymentObservations(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              disabled={savingPayment}
            />
          </Box>
        </DialogContent>
<DialogActions>
  <Button onClick={handleClosePayment} disabled={savingPayment}>
    Cancelar
  </Button>

  <LoadingActionButton
    onClick={handlePaymentSubmit}
    variant="contained"
    loading={savingPayment}
    loadingText="Guardando..."
  >
    Guardar
  </LoadingActionButton>
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