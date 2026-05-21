import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
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
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";
import {
  createLoan,
  getLoanFundSummary,
  getLoanPdfUrl,
  getLoans,
  Loan,
  LoanClient,
  LoanPreview,
  previewLoan,
  searchLoanClientByCuitCuil,
} from "../api/loanModules";

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatPesos(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "-";

  return `$ ${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

export default function Loans() {
  const { enqueueSnackbar } = useSnackbar();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [availableFund, setAvailableFund] = useState<number>(0);

  const [clientCuitCuil, setClientCuitCuil] = useState("");
  const [selectedClient, setSelectedClient] = useState<LoanClient | null>(null);

  const [requestedAmountText, setRequestedAmountText] = useState("");
  const [requestDate, setRequestDate] = useState(todayIso());
  const [weeklyInstallments, setWeeklyInstallments] = useState<number>(4);

  const [preview, setPreview] = useState<LoanPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const requestedAmount = useMemo(() => {
    const raw = requestedAmountText.replace(/[^\d]/g, "");
    return raw ? Number(raw) : 0;
  }, [requestedAmountText]);

  const canPreview =
    !!clientCuitCuil.trim() &&
    requestedAmount > 0 &&
    !!requestDate &&
    weeklyInstallments >= 1 &&
    weeklyInstallments <= 6;

  async function loadInitial() {
    try {
      const [loansData, fundData] = await Promise.all([
        getLoans(),
        getLoanFundSummary(),
      ]);

      setLoans(loansData);
      setAvailableFund(Number(fundData.availableFund || 0));
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al cargar préstamos",
        { variant: "error" },
      );
    }
  }

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearchClient() {
    try {
      if (!clientCuitCuil.trim()) {
        enqueueSnackbar("Ingresá un CUIT/CUIL para buscar", {
          variant: "warning",
        });
        return;
      }

      const result = await searchLoanClientByCuitCuil(clientCuitCuil.trim());

      if (!result.length) {
        setSelectedClient(null);
        enqueueSnackbar("No se encontró cliente con ese CUIT/CUIL", {
          variant: "warning",
        });
        return;
      }

      const client = result[0];
      setSelectedClient(client);
      setClientCuitCuil(client.cuitCuil);
      enqueueSnackbar("Cliente encontrado", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al buscar cliente",
        { variant: "error" },
      );
    }
  }

  function handleAmountChange(value: string) {
    const raw = value.replace(/[^\d]/g, "");
    if (!raw) {
      setRequestedAmountText("");
      return;
    }

    const formatted = Number(raw).toLocaleString("es-AR");
    setRequestedAmountText(`$ ${formatted}`);
  }

  async function handlePreview() {
    try {
      if (!canPreview) {
        enqueueSnackbar("Completá todos los campos del préstamo", {
          variant: "warning",
        });
        return;
      }

      setLoading(true);

      const data = await previewLoan({
        clientCuitCuil: clientCuitCuil.trim(),
        requestedAmount,
        requestDate,
        weeklyInstallments,
      });

      setPreview(data);
      setSelectedClient({
        id: data.client.id,
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        cuitCuil: data.client.cuitCuil,
        createdAt: "",
        updatedAt: "",
      });

      setAvailableFund(Number(data.availableFund || 0));
    } catch (error: any) {
      setPreview(null);
      enqueueSnackbar(
        error?.response?.data?.message || "Error al previsualizar préstamo",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLoan() {
    try {
      if (!preview) {
        enqueueSnackbar("Primero tenés que previsualizar el préstamo", {
          variant: "warning",
        });
        return;
      }

      if (!preview.canCreate) {
        enqueueSnackbar("No hay fondo disponible suficiente", {
          variant: "error",
        });
        return;
      }

      setLoading(true);

      const created = await createLoan({
        clientCuitCuil: clientCuitCuil.trim(),
        requestedAmount,
        requestDate,
        weeklyInstallments,
      });

      enqueueSnackbar("Préstamo generado correctamente", {
        variant: "success",
      });

      setPreview(null);
      setRequestedAmountText("");
      setWeeklyInstallments(4);
      setRequestDate(todayIso());

      await loadInitial();

      window.open(getLoanPdfUrl(created.id), "_blank");
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al generar préstamo",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }

  function statusChip(status: Loan["status"]) {
    if (status === "PAID") return <Chip label="Pagado" color="success" size="small" />;
    if (status === "CANCELLED") return <Chip label="Cancelado" color="default" size="small" />;
    return <Chip label="Activo" color="warning" size="small" />;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" color="white" fontWeight={700}>
            Préstamos
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Generación de préstamos personales y control de fondo disponible.
          </Typography>
        </Box>

        <Card sx={{ minWidth: 260, background: "rgba(255,255,255,0.08)", color: "white" }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Fondo disponible
            </Typography>
            <Typography variant="h5" fontWeight={800} color="#009879">
              {formatPesos(availableFund)}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ mb: 3, background: "rgba(255,255,255,0.08)", color: "white" }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Nuevo préstamo
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CUIT/CUIL"
                value={clientCuitCuil}
                onChange={(e) => {
                  setClientCuitCuil(e.target.value);
                  setSelectedClient(null);
                  setPreview(null);
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearchClient}
                sx={{ height: "56px", backgroundColor: "#00BFA5" }}
              >
                Buscar
              </Button>
            </Grid>

            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                label="Cliente"
                value={
                  selectedClient
                    ? `${selectedClient.firstName} ${selectedClient.lastName}`
                    : ""
                }
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Monto a solicitar"
                value={requestedAmountText}
                onChange={(e) => {
                  handleAmountChange(e.target.value);
                  setPreview(null);
                }}
                placeholder="$ 500.000"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de solicitud"
                value={requestDate}
                onChange={(e) => {
                  setRequestDate(e.target.value);
                  setPreview(null);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Cantidad de cuotas semanales"
                value={weeklyInstallments}
                onChange={(e) => {
                  setWeeklyInstallments(Number(e.target.value));
                  setPreview(null);
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="outlined"
              disabled={!canPreview || loading}
              onClick={handlePreview}
            >
              Previsualizar préstamo
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!preview || !preview.canCreate || loading}
              onClick={handleCreateLoan}
              sx={{ backgroundColor: "#00BFA5" }}
            >
              Generar préstamo
            </Button>
          </Stack>

          {preview && (
            <Box mt={3}>
              {!preview.canCreate && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Fondo insuficiente. Disponible: {formatPesos(preview.availableFund)}.
                  Solicitado: {formatPesos(preview.requestedAmount)}.
                </Alert>
              )}

              {preview.canCreate && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  El préstamo puede generarse. Luego de generarlo se descontará{" "}
                  {formatPesos(preview.requestedAmount)} del fondo disponible.
                </Alert>
              )}

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Monto solicitado
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatPesos(preview.requestedAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Interés crediticio
                  </Typography>
                  <Typography fontWeight={700}>
                    {preview.monthlyInterestRate}% mensual
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Interés calculado
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatPesos(preview.interestAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total a devolver
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatPesos(preview.totalToReturn)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Valor cuota
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatPesos(preview.installmentAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Mora diaria
                  </Typography>
                  <Typography fontWeight={700}>
                    {preview.dailyLateInterestRate}% sobre saldo pendiente
                  </Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#eeeeee" }}>
                    <TableRow>
                      <TableCell>Cuota</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {preview.installments.map((inst) => (
                      <TableRow key={inst.installmentNumber}>
                        <TableCell>
                          {inst.installmentNumber}/{inst.totalInstallments}
                        </TableCell>
                        <TableCell>{formatDate(inst.dueDate)}</TableCell>
                        <TableCell align="right">
                          {formatPesos(inst.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography variant="h6" color="white" mb={2}>
        Préstamos generados
      </Typography>

      <TableContainer component={Paper} sx={{ backgroundColor: "#171717", color: "white" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#1e1e1e" }}>
            <TableRow>
              <TableCell>Nº</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>CUIT/CUIL</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Solicitado</TableCell>
              <TableCell align="right">Total a devolver</TableCell>
              <TableCell align="center">Cuotas</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">PDF</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id} hover>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.clientName}</TableCell>
                <TableCell>{loan.clientCuitCuil}</TableCell>
                <TableCell>{formatDate(loan.requestDate)}</TableCell>
                <TableCell align="right">
                  {formatPesos(Number(loan.requestedAmount))}
                </TableCell>
                <TableCell align="right">
                  {formatPesos(Number(loan.totalToReturn))}
                </TableCell>
                <TableCell align="center">{loan.weeklyInstallments}</TableCell>
                <TableCell>{statusChip(loan.status)}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => window.open(getLoanPdfUrl(loan.id), "_blank")}
                  >
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!loans.length && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay préstamos generados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}