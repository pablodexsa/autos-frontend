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
  TableSortLabel,
} from "@mui/material";
import { AttachFile, Visibility, CheckCircle } from "@mui/icons-material";
import { listInstallments, markInstallmentPaid } from "../api/installments";
import { createInstallmentPayment } from "../api/installmentPayments";
import api from "../api/api";
import NotificationSnackbar from "../components/NotificationSnackbar";
import "../styles/Installments.css";


export default function Installments() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(
    null
  );
  const [form, setForm] = useState({
    amount: "",
    paymentDate: "",
    file: null as File | null,
  });

  const [filters, setFilters] = useState({
    client: "",
    status: "",
    dueDate: "",
  });

type Order = "asc" | "desc";

const [order, setOrder] = useState<Order>("asc");
const [orderBy, setOrderBy] = useState<
  "installmentLabel" | "client" | "amount" | "dueDate" | "status"
>("dueDate");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ?? Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => setSnackbar({ open: true, message, severity });

  const handleCloseSnackbar = () =>
    setSnackbar({ ...snackbar, open: false, message: "" });

const fetchInstallments = async () => {
  const data = await listInstallments();
  console.log("🔥 DATA QUE LLEGA DESDE EL BACK:", data);
  setInstallments(data);
  setFiltered(data);
};


  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleOpenPayment = (installmentId: number) => {
    setSelectedInstallment(installmentId);
    setOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInstallment) return;
    try {
      const formData = new FormData();
      formData.append("installmentId", String(selectedInstallment));
      formData.append("amount", form.amount);
      formData.append("paymentDate", form.paymentDate);
      if (form.file) formData.append("file", form.file);

      await createInstallmentPayment(formData);
      await markInstallmentPaid(selectedInstallment);
      setOpen(false);
      setForm({ amount: "", paymentDate: "", file: null });
      fetchInstallments();
      showSnackbar("? Pago registrado con éxito", "success");
    } catch {
      showSnackbar("? Error al registrar el pago", "error");
    }
  };


  const handleOpenReceipt = async (paymentId: number) => {
    try {
      const response = await api.get(`/installment-payments/${paymentId}/receipt`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      showSnackbar("?? No se pudo abrir el comprobante", "warning");
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

const getClientName = (i: any) => {
  const c = i.client || i.sale?.client;
  return c ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : "";
};

const compare = (a: any, b: any) => {
  let av: any;
  let bv: any;

  switch (orderBy) {
    case "installmentLabel":
      // "4/12" -> 4 (orden por número de cuota)
      av = Number(String(a.installmentLabel ?? "").split("/")[0]) || 0;
      bv = Number(String(b.installmentLabel ?? "").split("/")[0]) || 0;
      break;
    case "client":
      av = getClientName(a).toLowerCase();
      bv = getClientName(b).toLowerCase();
      break;
    case "amount":
      av = Number(a.amount ?? 0);
      bv = Number(b.amount ?? 0);
      break;
    case "dueDate":
      av = new Date(a.dueDate).getTime();
      bv = new Date(b.dueDate).getTime();
      break;
    case "status":
      av = (a.paid ? "PAID" : "PENDING");
      bv = (b.paid ? "PAID" : "PENDING");
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
    const dni =
      String(i.client?.dni ?? i.sale?.client?.dni ?? "").toLowerCase();

    const matchesClient = !q || name.includes(q) || dni.includes(q);

    const status = i.paid ? "PAID" : "PENDING";
    const matchesStatus = !filters.status || status === filters.status;

    const due = i.dueDate ? new Date(i.dueDate) : null;
    const dueISO = due ? due.toISOString().slice(0, 10) : "";
    const matchesDueDate = !filters.dueDate || dueISO === filters.dueDate;

    return matchesClient && matchesStatus && matchesDueDate;
  })
  .map((i) => ({
    ...i,
    // ✅ si tu backend ya manda installmentLabel, esto lo respeta.
    // si no lo manda, lo calcula en front con sale.installments
    installmentLabel: i.installmentLabel ?? getInstallmentLabel(i),
  }))
  .sort(compare);

const start = page * rowsPerPage + 1;
const end = Math.min(start + rowsPerPage - 1, filteredSorted.length);

const getInstallmentLabel = (installment: any) => {
  if (!installment?.sale?.installments?.length) return "—";

  // Ordenamos las cuotas por fecha
  const ordered = [...installment.sale.installments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const index = ordered.findIndex((x) => x.id === installment.id);

  if (index === -1) return "—";

  return `${index + 1}/${ordered.length}`;
};

  return (
    <Box className="installments-container">
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: 600 }}>
        Cuotas
      </Typography>

<Paper sx={{ p: 2, mt: 2, backgroundColor: "#1e1e2f", border: "1px solid rgba(255,255,255,0.08)" }}>
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
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="PENDING">Pendiente</MenuItem>
        <MenuItem value="PAID">Pagada</MenuItem>
      </TextField>
    </Grid>

    <Grid item xs={12} md={3}>
      <TextField
        type="date"
        fullWidth
        label="Vence en (fecha exacta)"
        InputLabelProps={{ shrink: true }}
        value={filters.dueDate}
        onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
      />
    </Grid>

    <Grid item xs={12} md={1} sx={{ display: "flex", alignItems: "center" }}>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setFilters({ client: "", status: "", dueDate: "" })}
      >
        Limpiar
      </Button>
    </Grid>
  </Grid>
</Paper>

      {/* Tabla */}
      <Paper className="table-container" sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cuota</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSorted
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.installmentLabel ?? "—"}</TableCell>
<TableCell>
  {i.client ? `${i.client.firstName} ${i.client.lastName}` : "—"}
</TableCell>

                  <TableCell>${Number(i.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{i.paid ? "Pagada" : "Pendiente"}</TableCell>
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
              ))}
          </TableBody>
        </Table>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1 }}
        >
          <Typography variant="body2" color="#ccc">
            Mostrando {start}-{end} de {filteredSorted.length} cuotas
          </Typography>
          <TablePagination
            component="div"
            count={filteredSorted.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página"
          />
        </Box>
      </Paper>

      {/* Modal de pago */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
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
              ?? {form.file.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmitPayment} variant="contained" color="success">
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* ?? Snackbar */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
}
