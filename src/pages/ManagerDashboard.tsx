import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
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
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TimelineIcon from "@mui/icons-material/Timeline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    month: "short",
    year: "2-digit",
  }).format(date);
}

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  borderColor: string;
};

function KpiCard({ title, value, subtitle, icon, borderColor }: KpiCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        border: `1px solid ${borderColor}`,
        background:
          "linear-gradient(180deg, rgba(24,24,24,0.98) 0%, rgba(15,15,15,0.98) 100%)",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
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
            rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.installmentNumber ?? "-"}</TableCell>
                <TableCell>{formatDate(row.dueDate)}</TableCell>
                <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                <TableCell align="right">
                  {formatCurrency(row.remainingAmount)}
                </TableCell>
                {showDaysOverdue ? (
                  <TableCell align="right">{row.daysOverdue ?? 0}</TableCell>
                ) : null}
                <TableCell>{row.status || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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

  const salesChartData = useMemo(
    () =>
      (data?.monthlySales || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data],
  );

  const collectionsChartData = useMemo(
    () =>
      (data?.monthlyCollections || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data],
  );

  const expensesChartData = useMemo(
    () =>
      (data?.monthlyExpenses || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data],
  );

  const cashflowChartData = useMemo(
    () =>
      (data?.monthlyCashflow || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data],
  );

  const dueMonthChartData = useMemo(
    () =>
      (data?.installmentsByDueMonth || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [data],
  );

  const agingData = data?.receivablesAging || [];

  const backlogStatusData = useMemo(
    () => [
      {
        name: "Vencido",
        amount: data?.summary.overdueInstallmentsAmount || 0,
      },
      {
        name: "A vencer",
        amount: data?.summary.notYetDueInstallmentsAmount || 0,
      },
    ],
    [data],
  );

  const agingColors = ["#ffb74d", "#ff9800", "#ef5350", "#b71c1c"];
  const backlogColors = ["#ef5350", "#42a5f5"];

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
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Dashboard Gerencial
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Resumen financiero, ventas, cobranzas, egresos y backlog de cuotas.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Ventas del mes"
              value={String(data.summary.monthlySalesCount || 0)}
              subtitle={formatCurrency(data.summary.monthlySalesAmount)}
              icon={<TrendingUpIcon />}
              borderColor="#29b6f6"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cobrado en cuotas (mes)"
              value={formatCurrency(
                data.summary.monthlyCollectedInstallmentsAmount,
              )}
              subtitle={`${
                data.summary.monthlyCollectedInstallmentsCount || 0
              } cuotas cobradas`}
              icon={<PointOfSaleIcon />}
              borderColor="#66bb6a"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Egresos del mes"
              value={formatCurrency(data.summary.monthlyExpensesAmount)}
              subtitle={`${
                data.summary.monthlyExpensesCount || 0
              } egresos / devoluciones`}
              icon={<MoneyOffIcon />}
              borderColor="#ff7043"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Resultado neto del mes"
              value={formatCurrency(data.summary.monthlyNetAmount)}
              subtitle="Cobrado en cuotas - egresos"
              icon={<AccountBalanceWalletIcon />}
              borderColor={
                data.summary.monthlyNetAmount >= 0 ? "#66bb6a" : "#ef5350"
              }
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard
              title="Backlog total de cuotas"
              value={formatCurrency(data.summary.receivablesBacklogAmount)}
              subtitle={`${
                data.summary.pendingInstallmentsCount || 0
              } cuotas pendientes`}
              icon={<ReceiptLongIcon />}
              borderColor="#ab47bc"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <KpiCard
              title="Backlog vencido"
              value={formatCurrency(data.summary.overdueInstallmentsAmount)}
              subtitle={`${
                data.summary.overdueInstallmentsCount || 0
              } cuotas vencidas`}
              icon={<WarningAmberIcon />}
              borderColor="#ef5350"
            />
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <KpiCard
              title="Backlog a vencer"
              value={formatCurrency(data.summary.notYetDueInstallmentsAmount)}
              subtitle={`${
                data.summary.notYetDueInstallmentsCount || 0
              } cuotas pendientes no vencidas`}
              icon={<EventAvailableIcon />}
              borderColor="#42a5f5"
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
                Ventas mensuales
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={salesChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Monto vendido"
                    fill="#29b6f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
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
                Flujo mensual
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={cashflowChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
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
                Cobranzas mensuales de cuotas
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={collectionsChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Cobrado"
                    fill="#66bb6a"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
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
                Egresos mensuales
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={expensesChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Egresos"
                    fill="#ff7043"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                p: 2,
                height: 420,
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
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
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

          <Grid item xs={12} lg={4}>
            <Paper
              sx={{
                p: 2,
                height: 420,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Estado del backlog
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={backlogStatusData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {backlogStatusData.map((_, index) => (
                      <Cell
                        key={`backlog-cell-${index}`}
                        fill={backlogColors[index % backlogColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

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
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cuotas vencidas"
              value={String(data.summary.overdueInstallmentsCount || 0)}
              subtitle={formatCurrency(data.summary.overdueInstallmentsAmount)}
              icon={<WarningAmberIcon />}
              borderColor="#ef5350"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Cuotas a vencer"
              value={String(data.summary.notYetDueInstallmentsCount || 0)}
              subtitle={formatCurrency(
                data.summary.notYetDueInstallmentsAmount,
              )}
              icon={<EventAvailableIcon />}
              borderColor="#42a5f5"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Series mensuales"
              value={String((data.monthlySales || []).length)}
              subtitle="Últimos 12 meses"
              icon={<TimelineIcon />}
              borderColor="#7e57c2"
            />
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
                      <Typography variant="body2">
                        {item.bucket} días
                      </Typography>
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
                height: 420,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Aging de deuda vencida
              </Typography>

              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={agingData}
                    dataKey="amount"
                    nameKey="bucket"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {agingData.map((_, index) => (
                      <Cell
                        key={`aging-cell-${index}`}
                        fill={agingColors[index % agingColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}