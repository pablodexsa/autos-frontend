import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useSnackbar } from "notistack";
import {
  getLoanInstallmentPayments,
  getLoanPaymentReceiptUrl,
  LoanInstallmentPayment,
} from "../api/loanModules";

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

export default function LoanInstallmentPayments() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<LoanInstallmentPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    from: "",
    to: "",
  });

  async function loadRows() {
    try {
      setLoading(true);
      const data = await getLoanInstallmentPayments();
      setRows(data);
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          "Error al cargar cuotas pagas de préstamos",
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

  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return rows.filter((row) => {
      const client =
        row.client ||
        row.installment?.client ||
        row.installment?.loan?.client ||
        null;

      const loan = row.loan || row.installment?.loan || null;

      const clientName = client
        ? `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase()
        : "";

      const cuit = String(client?.cuitCuil || "").toLowerCase();
      const loanId = String(row.loanId || loan?.id || "");
      const paymentId = String(row.id || "");

      const matchesQ =
        !q ||
        clientName.includes(q) ||
        cuit.includes(q) ||
        loanId.includes(q) ||
        paymentId.includes(q);

      const paymentDate = row.paymentDate?.slice(0, 10) || "";

      const matchesFrom = !filters.from || paymentDate >= filters.from;
      const matchesTo = !filters.to || paymentDate <= filters.to;

      return matchesQ && matchesFrom && matchesTo;
    });
  }, [rows, filters]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" color="white" fontWeight={700}>
            Cuotas pagas de Préstamos
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Historial de pagos realizados sobre cuotas de préstamos personales.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={loadRows}>
          Actualizar
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar por cliente, CUIT/CUIL, préstamo o pago"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Hasta"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#eeeeee" }}>
            <TableRow>
              <TableCell>Pago</TableCell>
              <TableCell>Préstamo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>CUIT/CUIL</TableCell>
              <TableCell>Cuota</TableCell>
              <TableCell>Fecha de pago</TableCell>
              <TableCell align="right">Monto pagado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Comprobante</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((row) => {
              const client =
                row.client ||
                row.installment?.client ||
                row.installment?.loan?.client ||
                null;

              const inst = row.installment || null;
              const loan = row.loan || row.installment?.loan || null;

              return (
                <TableRow key={row.id} hover>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>#{row.loanId || loan?.id || "-"}</TableCell>
                  <TableCell>
                    {client
                      ? `${client.firstName || ""} ${client.lastName || ""}`
                      : "-"}
                  </TableCell>
                  <TableCell>{client?.cuitCuil || "-"}</TableCell>
                  <TableCell>
                    {inst
                      ? `${inst.installmentNumber}/${inst.totalInstallments}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatDate(row.paymentDate)}</TableCell>
                  <TableCell align="right">
                    {formatPesos(Number(row.amount))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={row.isPaid ? "success" : "default"}
                      label={row.isPaid ? "Pago registrado" : "No pago"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={() =>
                        window.open(getLoanPaymentReceiptUrl(row.id), "_blank")
                      }
                    >
                      Recibo
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {!filteredRows.length && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {loading ? "Cargando..." : "No hay pagos para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}