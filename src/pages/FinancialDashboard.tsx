import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Grid, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FinancialDashboardSummary, getFinancialDashboardSummary } from '../api/financialDashboard';

const money = (value: number) => `$ ${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const dateAr = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR') : '-';

function Metric({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return <Paper sx={{ p: 2.25, height: '100%' }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h5" fontWeight={800} mt={0.5}>{value}</Typography>
    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
  </Paper>;
}

const FinancialDashboard: React.FC = () => {
  const [data, setData] = useState<FinancialDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await getFinancialDashboardSummary(date || undefined)); }
    catch (err: any) { setError(err?.response?.data?.message || 'No se pudo cargar el dashboard financiero.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxWeekly = useMemo(() => Math.max(1, ...(data?.weeklySeries.map((x) => x.collected) || [1])), [data]);

  if (loading && !data) return <Box p={4} textAlign="center"><CircularProgress /><Typography mt={2}>Cargando dashboard...</Typography></Box>;

  return <Box p={{ xs: 1, md: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
      <Box><Typography variant="h4" fontWeight={800}>Dashboard Financiero</Typography><Typography color="text.secondary">Cajas, cartera, cobranzas y mora de Kairos y GL Motors.</Typography></Box>
      <Stack direction="row" spacing={1}><TextField type="date" size="small" value={date} onChange={(e) => setDate(e.target.value)} /><Button variant="contained" startIcon={<RefreshIcon />} onClick={load}>Actualizar</Button></Stack>
    </Stack>

    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

    {data && <>
      <Typography variant="h6" fontWeight={800} mb={1.5}>Cajas</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Caja Kairos" value={money(data.boxes.kairos)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Caja GL Motors" value={money(data.boxes.glMotors)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Caja Gerencia" value={money(data.boxes.management)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Caja Logística" value={money(data.boxes.logistics)} /></Grid>
      </Grid>

      <Typography variant="h6" fontWeight={800} mb={1.5}>Cobranzas</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}><Metric title="Cobrado hoy" value={money(data.collections.today)} subtitle={`${data.collections.todayCount} pagos`} /></Grid>
        <Grid item xs={12} md={4}><Metric title="Cobrado esta semana" value={money(data.collections.week)} subtitle={`${data.collections.weekCount} pagos`} /></Grid>
        <Grid item xs={12} md={4}><Metric title="Cobrado este mes" value={money(data.collections.month)} subtitle={`${data.collections.monthCount} pagos`} /></Grid>
      </Grid>

      <Typography variant="h6" fontWeight={800} mb={1.5}>Cartera total</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Capital colocado" value={money(data.portfolio.principalPlaced)} subtitle={`${data.portfolio.activeLoans} préstamos activos`} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Capital recuperado" value={money(data.portfolio.principalRecovered)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Saldo contractual pendiente" value={money(data.portfolio.principalOutstanding)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Saldo vencido" value={money(data.portfolio.overdueOutstanding)} subtitle={`${data.portfolio.overdueInstallments} cuotas atrasadas`} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Interés cobrado" value={money(data.portfolio.interestCollected)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Mora cobrada" value={money(data.portfolio.lateFeesCollected)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Gastos cobrados" value={money(data.portfolio.expensesCollected)} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><Metric title="Saldo total de cajas" value={money(data.boxes.total)} /></Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        {([['Kairos Standard', data.products.kairosStandard], ['GL Motors', data.products.glMotors]] as const).map(([name, p]) => <Grid item xs={12} md={6} key={name}><Paper sx={{ p: 2.5 }}><Typography variant="h6" fontWeight={800}>{name}</Typography><Grid container spacing={1.5} mt={0.5}><Grid item xs={6}><Metric title="Capital colocado" value={money(p.principalPlaced)} /></Grid><Grid item xs={6}><Metric title="Capital recuperado" value={money(p.principalRecovered)} /></Grid><Grid item xs={6}><Metric title="Pendiente" value={money(p.principalOutstanding)} /></Grid><Grid item xs={6}><Metric title="Interés + mora cobrados" value={money(p.interestCollected + p.lateFeesCollected)} /></Grid></Grid></Paper></Grid>)}
      </Grid>

      <Paper sx={{ p: 2.5, mb: 3 }}><Typography variant="h6" fontWeight={800} mb={2}>Cobros de las últimas 8 semanas</Typography><Stack spacing={1.4}>{data.weeklySeries.map((row) => <Box key={row.from}><Stack direction="row" justifyContent="space-between"><Typography variant="caption">{dateAr(row.from)} – {dateAr(row.to)}</Typography><Typography variant="caption" fontWeight={700}>{money(row.collected)}</Typography></Stack><Box sx={{ height: 12, borderRadius: 10, bgcolor: 'action.hover', overflow: 'hidden' }}><Box sx={{ width: `${Math.max(1, (row.collected / maxWeekly) * 100)}%`, height: '100%', bgcolor: 'primary.main' }} /></Box></Box>)}</Stack></Paper>

      <Paper sx={{ p: 2 }}><Typography variant="h6" fontWeight={800} mb={2}>Cuotas vencidas</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Producto</TableCell><TableCell>Préstamo</TableCell><TableCell>Cuota</TableCell><TableCell>Vencimiento</TableCell><TableCell align="right">Pendiente</TableCell></TableRow></TableHead><TableBody>{data.overdue.map((row) => <TableRow key={row.id}><TableCell>{row.clientName}</TableCell><TableCell>{row.productType === 'GL_MOTORS' ? 'GL Motors' : 'Kairos'}</TableCell><TableCell>#{row.loanId}</TableCell><TableCell>{row.installmentNumber}/{row.totalInstallments}</TableCell><TableCell>{dateAr(row.dueDate)}</TableCell><TableCell align="right">{money(row.remainingAmount)}</TableCell></TableRow>)}{!data.overdue.length && <TableRow><TableCell colSpan={6} align="center">No hay cuotas vencidas.</TableCell></TableRow>}</TableBody></Table></TableContainer></Paper>
    </>}
  </Box>;
};

export default FinancialDashboard;
