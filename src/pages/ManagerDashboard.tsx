import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TimelineIcon from "@mui/icons-material/Timeline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PercentIcon from "@mui/icons-material/Percent";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InsightsIcon from "@mui/icons-material/Insights";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { getManagerDashboard } from "../api/dashboard";
import {
  DashboardInstallmentItem,
  ManagerDashboardResponse,
} from "../types/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR").format(date);
}

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPerformanceColor(ratio: number) {
  if (ratio >= 0.85) return "#66bb6a";
  if (ratio >= 0.6) return "#ffa726";
  return "#ef5350";
}

function getPerformanceLabel(ratio: number) {
  if (ratio >= 0.85) return "Cobranza saludable";
  if (ratio >= 0.6) return "Cobranza en seguimiento";
  return "Cobranza baja";
}

function getDebtRiskColor(overdueRatio: number) {
  if (overdueRatio >= 0.5) return "#ef5350";
  if (overdueRatio >= 0.25) return "#ffa726";
  return "#66bb6a";
}

function getNetColor(value: number) {
  if (value > 0) return "#66bb6a";
  if (value < 0) return "#ef5350";
  return "#90a4ae";
}

function normalizeStatus(status?: string | null) {
  return (status || "").trim().toUpperCase();
}

function getStatusChipProps(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("VENCIDA") ||
    normalized.includes("VENCIDO") ||
    normalized.includes("PARCIAL + VENCIDA") ||
    normalized.includes("PARCIAL+VENCIDA")
  ) {
    return {
      label: status || "Vencida",
      sx: {
        backgroundColor: "rgba(239,83,80,0.18)",
        color: "#ef5350",
        fontWeight: 700,
      },
    };
  }

  if (normalized.includes("PENDIENTE") || normalized.includes("PARCIAL")) {
    return {
      label: status || "Pendiente",
      sx: {
        backgroundColor: "rgba(255,167,38,0.18)",
        color: "#ffa726",
        fontWeight: 700,
      },
    };
  }

  if (normalized.includes("PAGADA") || normalized.includes("PAID")) {
    return {
      label: status || "Pagada",
      sx: {
        backgroundColor: "rgba(102,187,106,0.18)",
        color: "#66bb6a",
        fontWeight: 700,
      },
    };
  }

  return {
    label: status || "-",
    sx: {
      backgroundColor: "rgba(144,164,174,0.18)",
      color: "#90a4ae",
      fontWeight: 700,
    },
  };
}

function autoFitColumns(rows: Record<string, any>[]) {
  const safeRows = rows.length ? rows : [{ Detalle: "Sin datos" }];
  const headers = Object.keys(safeRows[0] || {});

  return headers.map((key) => ({
    wch:
      Math.max(
        key.length,
        ...safeRows.map((row) => String(row[key] ?? "").length)
      ) + 2,
  }));
}

function createCorporateSheet(title: string, rows: Record<string, any>[]) {
  const safeRows = rows.length ? rows : [{ Detalle: "Sin datos" }];

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["GL Motors"],
    [title],
    [`Generado: ${new Date().toLocaleString("es-AR")}`],
    [],
  ]);

  XLSX.utils.sheet_add_json(worksheet, safeRows, {
    origin: "A5",
    skipHeader: false,
  });

  worksheet["!cols"] = autoFitColumns(safeRows);

  if (worksheet["A1"]) {
    worksheet["A1"].s = {
      font: { bold: true, sz: 18 },
    };
  }

  if (worksheet["A2"]) {
    worksheet["A2"].s = {
      font: { bold: true, sz: 14 },
    };
  }

  return worksheet;
}

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  borderColor: string;
  progressValue?: number;
  valueColor?: string;
};

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  borderColor,
  progressValue,
  valueColor,
}: KpiCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        border: `1px solid ${borderColor}`,
        background:
          "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: valueColor || "inherit" }}
            >
              {value}
            </Typography>

            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                {subtitle}
              </Typography>
            ) : null}

            {typeof progressValue === "number" ? (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, progressValue))}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
              color: borderColor,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type InstallmentsTableProps = {
  title: string;
  rows: DashboardInstallmentItem[];
  showDaysOverdue?: boolean;
};

function InstallmentsTable({
  title,
  rows,
  showDaysOverdue = false,
}: InstallmentsTableProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        backgroundColor: "background.paper",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {title}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Cuota</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="right">Saldo</TableCell>
            {showDaysOverdue ? (
              <TableCell align="right">Días atraso</TableCell>
            ) : null}
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showDaysOverdue ? 6 : 5} align="center">
                Sin datos
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const chipProps = getStatusChipProps(row.status);

              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.installmentNumber ?? "-"}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.remainingAmount)}
                  </TableCell>
                  {showDaysOverdue ? (
                    <TableCell align="right">{row.daysOverdue ?? 0}</TableCell>
                  ) : null}
                  <TableCell>
                    <Chip
                      size="small"
                      label={chipProps.label}
                      sx={chipProps.sx}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

type ExecutiveMiniStatProps = {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
};

function ExecutiveMiniStat({
  label,
  value,
  color,
  icon,
}: ExecutiveMiniStatProps) {
  return (
    <Paper
      sx={{
        p: 2,
        border: `1px solid ${color}`,
        background:
          "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color }}>{icon}</Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
};

function ActionCard({ title, description, color, icon }: ActionCardProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        border: `1px solid ${color}`,
        background:
          "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color, mt: 0.25 }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getManagerDashboard();
        if (!active) return;
        setData(response);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "No se pudo cargar el dashboard gerencial");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const cashflowChartData = useMemo(
    () =>
      (data?.monthlyCashflow || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data]
  );

  const dueMonthChartData = useMemo(
    () =>
      (data?.installmentsByDueMonth || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data]
  );

  const agingData = data?.receivablesAging || [];

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const totalMesActual = data?.summary.currentMonthInstallmentsAmount || 0;
  const totalMesSiguiente = data?.summary.nextMonthInstallmentsAmount || 0;

  const cobranzasMes = data?.summary.monthlyCollectedInstallmentsAmount || 0;
  const backlogTotal = data?.summary.receivablesBacklogAmount || 0;
  const backlogVencido = data?.summary.overdueInstallmentsAmount || 0;
  const backlogAVencer = data?.summary.notYetDueInstallmentsAmount || 0;
  const resultadoNetoMes = data?.summary.monthlyNetAmount || 0;
  const judicialAmount = data?.summary.judicialAmount || 0;
  const judicialCount = data?.summary.judicialInstallmentsCount || 0;
  const judicialClients = data?.summary.judicialClientsCount || 0;

  const porcentajeCobranzaMes =
    totalMesActual > 0 ? cobranzasMes / totalMesActual : 0;

  const proporcionVencido =
    backlogTotal > 0 ? backlogVencido / backlogTotal : 0;

  const cobranzaColor = getPerformanceColor(porcentajeCobranzaMes);
  const cobranzaLabel = getPerformanceLabel(porcentajeCobranzaMes);
  const riesgoMoraColor = getDebtRiskColor(proporcionVencido);
  const netColor = getNetColor(resultadoNetoMes);

  function handleExportExcel() {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    const resumen = [
      { Concepto: "Total a ingresar mes actual", Importe: totalMesActual },
      { Concepto: "Total a ingresar mes siguiente", Importe: totalMesSiguiente },
      { Concepto: "Pagos del mes", Importe: cobranzasMes },
      {
        Concepto: "Cantidad de cuotas cobradas del mes",
        Importe: data.summary.monthlyCollectedInstallmentsCount || 0,
      },
      { Concepto: "Total cuotas pendientes", Importe: backlogTotal },
      {
        Concepto: "Cantidad de cuotas pendientes",
        Importe: data.summary.pendingInstallmentsCount || 0,
      },
      { Concepto: "Backlog vencido", Importe: backlogVencido },
      {
        Concepto: "Cantidad de cuotas vencidas",
        Importe: data.summary.overdueInstallmentsCount || 0,
      },
      { Concepto: "Backlog a vencer", Importe: backlogAVencer },
      {
        Concepto: "Cantidad de cuotas a vencer",
        Importe: data.summary.notYetDueInstallmentsCount || 0,
      },
      { Concepto: "Resultado neto mes", Importe: resultadoNetoMes },
      { Concepto: "Ejecución judicial", Importe: judicialAmount },
      { Concepto: "Cuotas en ejecución judicial", Importe: judicialCount },
      { Concepto: "Clientes en ejecución judicial", Importe: judicialClients },
      {
        Concepto: "% cobranza del mes",
        Importe: `${(porcentajeCobranzaMes * 100).toFixed(0)}%`,
      },
      {
        Concepto: "% vencido sobre backlog",
        Importe: `${(proporcionVencido * 100).toFixed(0)}%`,
      },
    ];

    const topVencidas = (data.topOverdueInstallments || []).map((row) => ({
      ID: row.id,
      Cuota: row.installmentNumber ?? "-",
      Vencimiento: formatDate(row.dueDate),
      Monto: row.amount || 0,
      Saldo: row.remainingAmount || 0,
      "Días atraso": row.daysOverdue ?? 0,
      Estado: row.status || "-",
    }));

    const proximas = (data.upcomingInstallments || []).map((row) => ({
      ID: row.id,
      Cuota: row.installmentNumber ?? "-",
      Vencimiento: formatDate(row.dueDate),
      Monto: row.amount || 0,
      Saldo: row.remainingAmount || 0,
      Estado: row.status || "-",
    }));

    const flujoMensual = (data.monthlyCashflow || []).map((row) => ({
      Mes: formatMonth(row.month),
      Ingresos: row.income || 0,
      Egresos: row.expenses || 0,
      "Resultado neto": row.net || 0,
    }));

    const ventasMensuales = (data.monthlySales || []).map((row) => ({
      Mes: formatMonth(row.month),
      Cantidad: row.count || 0,
      Importe: row.amount || 0,
    }));

    const cuotasPorMes = (data.installmentsByDueMonth || []).map((row) => ({
      Mes: formatMonth(row.month),
      "Monto total": row.dueAmount || 0,
      Pagado: row.paidAmount || 0,
      Pendiente: row.pendingAmount || 0,
      "Cuotas pagadas": row.paidCount || 0,
      "Cuotas impagas": row.unpaidCount || 0,
    }));

    const aging = (data.receivablesAging || []).map((row) => ({
      Rango: `${row.bucket} días`,
      Cantidad: row.count || 0,
      Importe: row.amount || 0,
    }));

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Resumen ejecutivo", resumen),
      "Resumen"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Top cuotas vencidas", topVencidas),
      "Cuotas vencidas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Próximas cuotas a vencer", proximas),
      "Proximas cuotas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Flujo mensual", flujoMensual),
      "Flujo mensual"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Ventas mensuales", ventasMensuales),
      "Ventas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Cuotas por mes de vencimiento", cuotasPorMes),
      "Cuotas por mes"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      createCorporateSheet("Aging de deuda vencida", aging),
      "Aging"
    );

    XLSX.writeFile(
      workbook,
      `GL-Motors-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  const alertasEjecutivas = [
    porcentajeCobranzaMes < 0.6
      ? {
          severity: "error" as const,
          icon: <ErrorOutlineIcon fontSize="small" />,
          text: `La cobranza del mes está en ${(
            porcentajeCobranzaMes * 100
          ).toFixed(0)}% del objetivo.`,
        }
      : porcentajeCobranzaMes < 0.85
      ? {
          severity: "warning" as const,
          icon: <InfoOutlinedIcon fontSize="small" />,
          text: `La cobranza del mes está en ${(
            porcentajeCobranzaMes * 100
          ).toFixed(0)}%. Conviene seguirla de cerca.`,
        }
      : {
          severity: "success" as const,
          icon: <CheckCircleOutlineIcon fontSize="small" />,
          text: `La cobranza del mes está saludable: ${(
            porcentajeCobranzaMes * 100
          ).toFixed(0)}% del objetivo.`,
        },
    proporcionVencido >= 0.5
      ? {
          severity: "error" as const,
          icon: <WarningAmberIcon fontSize="small" />,
          text: "Más del 50% del backlog corresponde a cuotas vencidas.",
        }
      : proporcionVencido >= 0.25
      ? {
          severity: "warning" as const,
          icon: <WarningAmberIcon fontSize="small" />,
          text: "Una parte relevante del backlog ya está vencida.",
        }
      : {
          severity: "success" as const,
          icon: <CheckCircleOutlineIcon fontSize="small" />,
          text: "La mayor parte del backlog todavía no está vencida.",
        },
    judicialAmount > 0
      ? {
          severity: "warning" as const,
          icon: <WarningAmberIcon fontSize="small" />,
          text: `Hay ${formatCurrency(judicialAmount)} en ejecución judicial.`,
        }
      : {
          severity: "success" as const,
          icon: <CheckCircleOutlineIcon fontSize="small" />,
          text: "No hay deuda en ejecución judicial.",
        },
  ];

  const accionesSugeridas = [
    {
      title: "Priorizar cobranza vencida",
      description:
        backlogVencido > 0
          ? `Hay ${formatCurrency(
              backlogVencido
            )} en cuotas vencidas. Conviene enfocar seguimiento en esa cartera primero.`
          : "No hay deuda vencida relevante para priorizar.",
      color: riesgoMoraColor,
      icon: <PriorityHighIcon />,
    },
    {
      title: "Anticipar próximas gestiones",
      description:
        backlogAVencer > 0
          ? `El próximo bloque a gestionar suma ${formatCurrency(
              backlogAVencer
            )}. Conviene hacer seguimiento preventivo antes del vencimiento.`
          : "No hay cuotas próximas a vencer con peso significativo.",
      color: "#42a5f5",
      icon: <AutorenewIcon />,
    },
    {
      title: "Medir cierre del mes",
      description:
        totalMesActual > 0
          ? `Hoy se cobraron ${formatCurrency(cobranzasMes)} sobre ${formatCurrency(
              totalMesActual
            )} previstos para el mes actual.`
          : "No hay previsión cargada para el mes actual.",
      color: cobranzaColor,
      icon: <AssignmentTurnedInIcon />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No hay datos disponibles.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Dashboard Gerencial
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Resumen financiero y de cobranzas con foco ejecutivo.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={!data}
              sx={{ fontWeight: 700 }}
            >
              Exportar Excel
            </Button>
          </Stack>
        </Box>

        <Paper
          sx={{
            p: 2.5,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(14,14,14,0.98) 100%)",
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Resumen ejecutivo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Lectura rápida del estado actual del negocio.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={3}>
                <ExecutiveMiniStat
                  label="Cobrado este mes"
                  value={formatCurrency(cobranzasMes)}
                  color={cobranzaColor}
                  icon={<BoltIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <ExecutiveMiniStat
                  label="Previsto este mes"
                  value={formatCurrency(totalMesActual)}
                  color="#42a5f5"
                  icon={<AccessTimeIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <ExecutiveMiniStat
                  label="Backlog vencido"
                  value={formatCurrency(backlogVencido)}
                  color={riesgoMoraColor}
                  icon={<TrendingDownIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <ExecutiveMiniStat
                  label="Resultado neto mes"
                  value={formatCurrency(resultadoNetoMes)}
                  color={netColor}
                  icon={<InsightsIcon />}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {alertasEjecutivas.map((alerta, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Alert
                severity={alerta.severity}
                icon={alerta.icon}
                sx={{
                  borderRadius: 2,
                  alignItems: "center",
                }}
              >
                {alerta.text}
              </Alert>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Total a ingresar mes actual"
              value={formatCurrency(totalMesActual)}
              subtitle={formatMonth(currentMonthKey)}
              icon={<AccountBalanceWalletIcon />}
              borderColor="#66bb6a"
              valueColor="#66bb6a"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Total a ingresar mes siguiente"
              value={formatCurrency(totalMesSiguiente)}
              subtitle={formatMonth(nextMonthKey)}
              icon={<EventAvailableIcon />}
              borderColor="#42a5f5"
              valueColor="#42a5f5"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Total cuotas pendientes"
              value={formatCurrency(backlogTotal)}
              subtitle={`${data.summary.pendingInstallmentsCount || 0} cuotas pendientes`}
              icon={<ReceiptLongIcon />}
              borderColor="#ab47bc"
              valueColor="#ab47bc"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Pagos del mes"
              value={formatCurrency(cobranzasMes)}
              subtitle={`${data.summary.monthlyCollectedInstallmentsCount || 0} cuotas cobradas`}
              icon={<PointOfSaleIcon />}
              borderColor={cobranzaColor}
              valueColor={cobranzaColor}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Ejecución judicial"
              value={formatCurrency(judicialAmount)}
              subtitle={`${judicialCount} cuotas · ${judicialClients} clientes`}
              icon={<WarningAmberIcon />}
              borderColor="#ef5350"
              valueColor="#ef5350"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <KpiCard
              title="% de cobranza del mes"
              value={`${(porcentajeCobranzaMes * 100).toFixed(0)}%`}
              subtitle={cobranzaLabel}
              icon={<PercentIcon />}
              borderColor={cobranzaColor}
              valueColor={cobranzaColor}
              progressValue={porcentajeCobranzaMes * 100}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <KpiCard
              title="Backlog vencido"
              value={formatCurrency(backlogVencido)}
              subtitle={`${data.summary.overdueInstallmentsCount || 0} cuotas vencidas`}
              icon={<WarningAmberIcon />}
              borderColor={riesgoMoraColor}
              valueColor={riesgoMoraColor}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <KpiCard
              title="Backlog a vencer"
              value={formatCurrency(backlogAVencer)}
              subtitle={`${data.summary.notYetDueInstallmentsCount || 0} cuotas pendientes no vencidas`}
              icon={<EventAvailableIcon />}
              borderColor="#42a5f5"
              valueColor="#42a5f5"
            />
          </Grid>
        </Grid>

        <Paper
          sx={{
            p: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Foco de gestión
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Qué conviene mirar primero.
              </Typography>
            </Box>

            <Divider />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="body1" fontWeight={700}>
                  Cobrado: {formatCurrency(cobranzasMes)} de{" "}
                  {formatCurrency(totalMesActual)} previstos para el mes actual.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Próximo mes proyectado: {formatCurrency(totalMesSiguiente)}.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Cobranza ${(porcentajeCobranzaMes * 100).toFixed(0)}%`}
                  sx={{
                    backgroundColor: `${cobranzaColor}22`,
                    color: cobranzaColor,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={`Vencido ${(proporcionVencido * 100).toFixed(
                    0
                  )}% del backlog`}
                  sx={{
                    backgroundColor: `${riesgoMoraColor}22`,
                    color: riesgoMoraColor,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={`Resultado ${
                    resultadoNetoMes >= 0 ? "positivo" : "negativo"
                  }`}
                  sx={{
                    backgroundColor: `${netColor}22`,
                    color: netColor,
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <InstallmentsTable
              title="Top 10 cuotas vencidas"
              rows={data.topOverdueInstallments}
              showDaysOverdue
            />
          </Grid>

          <Grid item xs={12} lg={6}>
            <InstallmentsTable
              title="Próximas 10 cuotas a vencer"
              rows={data.upcomingInstallments}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cuotas pendientes"
              value={String(data.summary.pendingInstallmentsCount || 0)}
              subtitle={formatCurrency(data.summary.pendingInstallmentsAmount)}
              icon={<PaymentsIcon />}
              borderColor="#ffa726"
              valueColor="#ffa726"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cuotas vencidas"
              value={String(data.summary.overdueInstallmentsCount || 0)}
              subtitle={formatCurrency(data.summary.overdueInstallmentsAmount)}
              icon={<WarningAmberIcon />}
              borderColor="#ef5350"
              valueColor="#ef5350"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cuotas a vencer"
              value={String(data.summary.notYetDueInstallmentsCount || 0)}
              subtitle={formatCurrency(data.summary.notYetDueInstallmentsAmount)}
              icon={<EventAvailableIcon />}
              borderColor="#42a5f5"
              valueColor="#42a5f5"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Series mensuales"
              value={String((data.monthlySales || []).length)}
              subtitle="Últimos 12 meses"
              icon={<TimelineIcon />}
              borderColor="#7e57c2"
              valueColor="#7e57c2"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 2,
                height: 380,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Flujo mensual
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={cashflowChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Ingresos"
                    fill="#66bb6a"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Egresos"
                    fill="#ff7043"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Resultado neto"
                    stroke="#42a5f5"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 2,
                height: 380,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Cuotas por mes de vencimiento
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={dueMonthChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar
                    dataKey="paidAmount"
                    name="Pagadas"
                    stackId="a"
                    fill="#66bb6a"
                  />
                  <Bar
                    dataKey="pendingAmount"
                    name="Pendientes"
                    stackId="a"
                    fill="#ffa726"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                height: "100%",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Aging de deuda vencida
              </Typography>

              <Stack spacing={1.25}>
                {agingData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Sin deuda vencida para mostrar.
                  </Typography>
                ) : (
                  agingData.map((item) => (
                    <Box
                      key={item.bucket}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Typography variant="body2">{item.bucket} días</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
                height: "100%",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Acciones sugeridas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Recomendaciones automáticas para enfocar la gestión.
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {accionesSugeridas.map((accion, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <ActionCard
                        title={accion.title}
                        description={accion.description}
                        color={accion.color}
                        icon={accion.icon}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}