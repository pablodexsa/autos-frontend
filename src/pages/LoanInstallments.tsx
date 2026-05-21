import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";
import { useSnackbar } from "notistack";
import {
  getLoanInstallments,
  LoanInstallment,
  registerLoanInstallmentPayment,
} from "../api/loanModules";

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

function formatPesos(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "-";

  return `$ ${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseMoney(value: string) {
  if (!value) return 0;

  const cleaned = value
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(value: number) {
  return `$ ${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function moneyInput(value: string) {
  const raw = value.replace(/[^\d]/g, "");
  if (!raw) return "";
  return `$ ${Number(raw).toLocaleString("es-AR")}`;
}

function calculateCurrentAmountForDate(
  installment: LoanInstallment,
  selectedPaymentDate: string,
) {
  const base =
    installment?.remainingAmount != null
      ? Number(installment.remainingAmount)
      : Number(installment.amount ?? 0);

  if (!selectedPaymentDate || !installment?.dueDate || installment?.paid) {
    return Number(base.toFixed(2));
  }

const dueStr = installment.dueDate.slice(0, 10);

let startStr = dueStr;

if (installment?.status === "PARTIALLY_PAID" && installment?.lastPaymentAt) {
  const lastPaymentStr = installment.lastPaymentAt.slice(0, 10);

  if (lastPaymentStr > dueStr) {
    startStr = lastPaymentStr;
  }
}

  const payStr = selectedPaymentDate;

  if (!startStr || !payStr || payStr <= startStr) {
    return Number(base.toFixed(2));
  }

  const startDate = new Date(`${startStr}T00:00:00`);
  const payDate = new Date(`${payStr}T00:00:00`);

  const diffMs = payDate.getTime() - startDate.getTime();
  const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) {
    return Number(base.toFixed(2));
  }

  return Number((base * (1 + 0.05 * daysLate)).toFixed(2));
}

export default function LoanInstallments() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<LoanInstallment[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    status: "",
  });

  const [selected, setSelected] = useState<LoanInstallment | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentCurrentAmount, setPaymentCurrentAmount] = useState(0);
  const [observations, setObservations] = useState("");

  async function loadRows() {
    try {
      setLoading(true);
      const data = await getLoanInstallments();
      setRows(data);
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al cargar cuotas de préstamos",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected || !paymentDate) return;

    const currentAmount = calculateCurrentAmountForDate(selected, paymentDate);

    setPaymentCurrentAmount(currentAmount);
    setPaymentAmount(formatMoneyInput(currentAmount));
  }, [selected, paymentDate]);

  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return rows.filter((row) => {
      const clientName = row.client
        ? `${row.client.firstName} ${row.client.lastName}`.toLowerCase()
        : "";

      const cuit = row.client?.cuitCuil?.toLowerCase() || "";
      const loanId = String(row.loanId || "");

      const matchesQ =
        !q ||
        clientName.includes(q) ||
        cuit.includes(q) ||
        loanId.includes(q);

      const matchesStatus =
        !filters.status ||
        row.status === filters.status ||
        (filters.status === "OVERDUE" && row.isOverdue) ||
        (filters.status === "PARTIAL_OVERDUE" &&
          row.status === "PARTIALLY_PAID" &&
          row.isOverdue);

      return matchesQ && matchesStatus;
    });
  }, [rows, filters]);

  function openPayment(row: LoanInstallment) {
    const today = todayIso();
    const currentAmount = calculateCurrentAmountForDate(row, today);

    setSelected(row);
    setPaymentDate(today);
    setPaymentCurrentAmount(currentAmount);
    setPaymentAmount(formatMoneyInput(currentAmount));
    setObservations("");
    setPaymentOpen(true);
  }

  function closePayment() {
    setPaymentOpen(false);
    setSelected(null);
    setPaymentAmount("");
    setPaymentDate(todayIso());
    setPaymentCurrentAmount(0);
    setObservations("");
  }

  async function submitPayment() {
    try {
      if (!selected) return;

      const amount = parseMoney(paymentAmount);

      if (!amount || amount <= 0) {
        enqueueSnackbar("El monto del pago debe ser mayor a cero", {
          variant: "warning",
        });
        return;
      }

      await registerLoanInstallmentPayment(selected.id, {
        amount,
        paymentDate,
        observations: observations.trim() || undefined,
      });

      enqueueSnackbar("Pago registrado correctamente", {
        variant: "success",
      });

      closePayment();
      await loadRows();
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.response?.data?.mensaje ||
          "Error al registrar pago",
        { variant: "error" },
      );
    }
  }

  function getStatusLabel(row: LoanInstallment) {
    if (row.paid || row.status === "PAID") return "Pagada";
    if (row.status === "PARTIALLY_PAID" && row.isOverdue) {
      return "Parcial + Vencida";
    }
    if (row.status === "PARTIALLY_PAID") return "Parcial";
    if (row.isOverdue) return "Vencida";
    return "Pendiente";
  }

  function statusChip(row: LoanInstallment) {
    if (row.paid || row.status === "PAID") {
      return <Chip label="Pagada" color="success" size="small" />;
    }

    if (row.status === "PARTIALLY_PAID") {
      return (
        <Chip
          label={row.isOverdue ? "Parcial + vencida" : "Parcial"}
          color={row.isOverdue ? "error" : "warning"}
          size="small"
        />
      );
    }

    if (row.isOverdue) {
      return <Chip label="Vencida" color="error" size="small" />;
    }

    return <Chip label="Pendiente" color="default" size="small" />;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" color="white" fontWeight={700}>
            Cuotas de Préstamos
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Cuotas pendientes, parciales y vencidas de préstamos personales.
          </Typography>
        </Box>
      </Stack>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Cliente / CUIT-CUIL / Nº préstamo"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              label="Estado"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="OVERDUE">Vencida</option>
              <option value="PARTIALLY_PAID">Parcial</option>
              <option value="PARTIAL_OVERDUE">Parcial + Vencida</option>
              <option value="PAID">Pagada</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ height: "56px" }}
              onClick={loadRows}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <Table
          size="small"
          sx={{
            "& .MuiTableCell-root": {
              color: "white",
              borderColor: "rgba(255,255,255,0.12)",
            },
          }}
        >
          <TableHead sx={{ backgroundColor: "#171717" }}>
            <TableRow>
              <TableCell>Préstamo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>CUIT/CUIL</TableCell>
              <TableCell>Cuota</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell align="right">Monto original</TableCell>
              <TableCell align="right">Saldo pendiente</TableCell>
              <TableCell align="right">Pagado</TableCell>
              <TableCell align="right">Monto actualizado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>#{row.loanId}</TableCell>
                <TableCell>
                  {row.client
                    ? `${row.client.firstName} ${row.client.lastName}`
                    : "-"}
                </TableCell>
                <TableCell>{row.client?.cuitCuil || "-"}</TableCell>
                <TableCell>{row.installmentLabel}</TableCell>
                <TableCell>{formatDate(row.dueDate)}</TableCell>
                <TableCell align="right">{formatPesos(row.amount)}</TableCell>
                <TableCell align="right">
                  {formatPesos(row.currentAmount)}
                </TableCell>
                <TableCell align="right">
                  {formatPesos(row.paidAmount || 0)}
                </TableCell>
                <TableCell align="right">
                  <strong>{formatPesos(row.currentAmount)}</strong>
                </TableCell>
                <TableCell>{statusChip(row)}</TableCell>
                <TableCell align="right">
                  {!row.paid && (
                    <Button
                      size="small"
                      variant="contained"
                      color={
                        row.status === "PARTIALLY_PAID" ? "warning" : "success"
                      }
                      startIcon={<PaymentsIcon />}
                      onClick={() => openPayment(row)}
                    >
                      {row.status === "PARTIALLY_PAID"
                        ? "Abonar saldo"
                        : "Pagar"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!filteredRows.length && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {loading ? "Cargando..." : "No hay cuotas para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={paymentOpen}
        onClose={closePayment}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Registrar pago de cuota</DialogTitle>

        <DialogContent>
          {selected && (
            <Stack spacing={2} mt={1}>
              <Alert severity={selected.isOverdue ? "warning" : "info"}>
                Cuota {selected.installmentLabel} del préstamo #{selected.loanId}
                <br />
                Estado: <strong>{getStatusLabel(selected)}</strong>
                <br />
                Saldo pendiente base:{" "}
                <strong>{formatPesos(selected.remainingAmount)}</strong>
                <br />
                Valor actualizado al día seleccionado:{" "}
                <strong>{formatPesos(paymentCurrentAmount)}</strong>
              </Alert>

              <TextField
                label="Cliente"
                fullWidth
                value={
                  selected.client
                    ? `${selected.client.firstName} ${selected.client.lastName}`
                    : ""
                }
                InputProps={{ readOnly: true }}
              />

              <TextField
                label="Fecha de pago"
                type="date"
                fullWidth
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Monto a pagar"
                fullWidth
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(moneyInput(e.target.value))}
              />

              <TextField
                label="Observaciones"
                fullWidth
                multiline
                minRows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closePayment}>Cancelar</Button>
          <Button variant="contained" onClick={submitPayment}>
            Registrar pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}