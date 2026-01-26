import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import api from "../api/api";
import type { RefundRow, RefundStatus } from "../types/refund";

const pesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { hour12: false });
};

function StatusChip({ status }: { status: RefundStatus }) {
  if (status === "PENDING") return <Chip size="small" label="Pendiente" />;
  return <Chip size="small" label="Entregada" />;
}

export default function Refunds() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | RefundStatus>("");

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({ open: false, msg: "", sev: "success" });

  // Dialog registrar devolución
  const [openDeliver, setOpenDeliver] = useState(false);
  const [selected, setSelected] = useState<RefundRow | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (q.trim()) params.q = q.trim();
      if (status) params.status = status;

      const { data } = await api.get<RefundRow[]>("/refunds", { params });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]); // ✅ importante para que DataGrid no quede con basura
      setSnack({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.response?.data?.mensaje ||
          e?.message ||
          "Error al cargar devoluciones",
        sev: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onOpenDeliver = (row: RefundRow) => {
    setSelected(row);
    setPaidAmount(String(row.expectedAmount ?? 0));
    setOpenDeliver(true);
  };

  const onCloseDeliver = () => {
    if (saving) return;
    setOpenDeliver(false);
    setSelected(null);
    setPaidAmount("");
  };

  const onConfirmDeliver = async () => {
    if (!selected) return;

    const n = Number(paidAmount);
    if (!Number.isFinite(n) || n < 0) {
      setSnack({ open: true, msg: "Monto inválido", sev: "error" });
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/refunds/${selected.id}/deliver`, { paidAmount: n });
      setSnack({
        open: true,
        msg: "Devolución registrada como entregada",
        sev: "success",
      });
      onCloseDeliver();
      await fetchRefunds();
    } catch (e: any) {
      setSnack({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.response?.data?.mensaje ||
          "Error al registrar devolución",
        sev: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDownloadPdf = async (row: RefundRow) => {
    try {
      const resp = await api.get(`/refunds/${row.id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([resp.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Comprobante_Devolucion_Reserva_${row.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setSnack({ open: true, msg: "No se pudo descargar el PDF", sev: "error" });
    }
  };

  // ✅ IMPORTANTE: MUI DataGrid v6 usa valueGetter(value, row)
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "#", width: 80 },
      { field: "clientDni", headerName: "DNI", width: 140 },
      { field: "plate", headerName: "Patente", width: 120 },
      { field: "vehicleLabel", headerName: "Vehículo", flex: 1, minWidth: 260 },
      {
        field: "canceledAt",
        headerName: "Fecha (cancelación)",
        width: 190,
        valueGetter: (_value, row: any) => formatDateTime(row?.canceledAt),
      },
      {
        field: "status",
        headerName: "Estado",
        width: 130,
        renderCell: (p) => <StatusChip status={p.row.status} />,
      },
      {
        field: "deliveredByUser",
        headerName: "Entregada por",
        width: 200,
        valueGetter: (_value, row: any) => {
          const u: any = row?.deliveredByUser;
          if (!u) return "-";
          const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
          return full || u.name || u.username || "-";
        },
      },
      {
        field: "paidAmount",
        headerName: "Saldo abonado",
        width: 170,
        valueGetter: (_value, row: any) =>
          row?.paidAmount != null ? pesos(Number(row.paidAmount)) : "-",
      },
      {
        field: "deliveredAt",
        headerName: "Fecha devolución",
        width: 190,
        valueGetter: (_value, row: any) => formatDateTime(row?.deliveredAt),
      },
      {
        field: "expectedAmount",
        headerName: "Monto a devolver",
        width: 170,
        valueGetter: (_value, row: any) => pesos(Number(row?.expectedAmount ?? 0)),
      },
      {
        field: "doc",
        headerName: "Documentación",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Button size="small" variant="outlined" onClick={() => onDownloadPdf(p.row)}>
            PDF
          </Button>
        ),
      },
      {
        field: "actions",
        headerName: "Acción",
        width: 170,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Button
            size="small"
            variant="contained"
            disabled={p.row.status !== "PENDING"}
            onClick={() => onOpenDeliver(p.row)}
          >
            Registrar
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Devoluciones</Typography>
          <Button variant="outlined" onClick={fetchRefunds} disabled={loading}>
            Actualizar
          </Button>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="DNI, patente o vehículo"
            fullWidth
          />
          <TextField
            select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PENDING">Pendiente</MenuItem>
            <MenuItem value="DELIVERED">Entregada</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={fetchRefunds} disabled={loading}>
            Filtrar
          </Button>
        </Stack>

        <Box sx={{ height: 620, width: "100%" }}>
          <DataGrid
            rows={rows}
            getRowId={(r) => r.id}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
          />
        </Box>
      </Paper>

      <Dialog open={openDeliver} onClose={onCloseDeliver} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar devolución</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Box>
              <Typography sx={{ mb: 1 }}>
                Reserva #{selected.reservationId} · {selected.vehicleLabel} · {selected.plate}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Monto sugerido: <b>{pesos(Number(selected.expectedAmount ?? 0))}</b>
              </Typography>

              <TextField
                label="Monto devuelto"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeliver} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onConfirmDeliver} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={22} /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
