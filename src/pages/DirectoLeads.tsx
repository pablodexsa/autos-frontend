import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import {
  consultDirecto,
  deleteDirectoLead,
  listDirectoLeads,
  recheckDirectoLead,
  updateDirectoLead,
} from "../api/directo";
import {
  ConsultDirectoResponse,
  DirectoGender,
  DirectoLead,
  DirectoLeadStatus,
} from "../types/directo";

type SnackbarState = {
  open: boolean;
  severity: "success" | "error" | "info" | "warning";
  message: string;
};

type FilterState = {
  search: string;
  status: DirectoLeadStatus | "";
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
};

type ConsultFormState = {
  dni: string;
  gender: DirectoGender;
};

type EditFormState = {
  phone: string;
  email: string;
  address: string;
  observations: string;
};

const initialFilters: FilterState = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const initialConsultForm: ConsultFormState = {
  dni: "",
  gender: "M",
};

const initialEditForm: EditFormState = {
  phone: "",
  email: "",
  address: "",
  observations: "",
};

function normalizeDni(value: string) {
  return value.replace(/\D/g, "");
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: DirectoLeadStatus) {
  switch (status) {
    case "approved":
      return "Aprobado";
    case "rejected":
      return "Rechazado";
    case "pending":
      return "Pendiente";
    case "error":
      return "Error";
    default:
      return status;
  }
}

function getStatusColor(
  status: DirectoLeadStatus
): "success" | "error" | "warning" | "default" {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "pending":
      return "warning";
    case "error":
      return "default";
    default:
      return "default";
  }
}

const DirectoLeads: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DirectoLead[]>([]);
  const [total, setTotal] = useState(0);

  const [consultOpen, setConsultOpen] = useState(false);
  const [consultSubmitting, setConsultSubmitting] = useState(false);
  const [consultForm, setConsultForm] =
    useState<ConsultFormState>(initialConsultForm);
  const [consultResult, setConsultResult] =
    useState<ConsultDirectoResponse | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [selectedLead, setSelectedLead] = useState<DirectoLead | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnackbar = useCallback(
    (
      severity: SnackbarState["severity"],
      message: string
    ) => {
      setSnackbar({
        open: true,
        severity,
        message,
      });
    },
    []
  );

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);

      const response = await listDirectoLeads({
        search: filters.search || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      setRows(response.items);
      setTotal(response.total);
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        "error",
        error?.response?.data?.message || "No se pudieron cargar los leads de Directo."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, showSnackbar]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / filters.limit));
  }, [total, filters.limit]);

  const handleOpenConsult = () => {
    setConsultForm(initialConsultForm);
    setConsultResult(null);
    setConsultOpen(true);
  };

  const handleCloseConsult = () => {
    if (consultSubmitting) return;
    setConsultOpen(false);
  };

  const handleSubmitConsult = async () => {
    try {
      const dni = normalizeDni(consultForm.dni);

      if (dni.length < 7 || dni.length > 8) {
        showSnackbar("error", "El DNI debe contener entre 7 y 8 dígitos.");
        return;
      }

      setConsultSubmitting(true);
      const response = await consultDirecto({
        dni,
        gender: consultForm.gender,
      });

      setConsultResult(response);
      await fetchLeads();

      showSnackbar(
        response.status === "approved" ? "success" : "info",
        response.status === "approved"
          ? "Consulta realizada. Cliente aprobado."
          : "Consulta realizada."
      );
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        "error",
        error?.response?.data?.message || "No se pudo realizar la consulta."
      );
    } finally {
      setConsultSubmitting(false);
    }
  };

  const openEditDialog = (lead: DirectoLead) => {
    setSelectedLead(lead);
    setEditForm({
      phone: lead.phone || "",
      email: lead.email || "",
      address: lead.address || "",
      observations: lead.observations || "",
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setSelectedLead(null);
  };

  const handleSubmitEdit = async () => {
    if (!selectedLead) return;

    try {
      setEditSubmitting(true);

      await updateDirectoLead(selectedLead.id, {
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        address: editForm.address.trim() || undefined,
        observations: editForm.observations.trim() || undefined,
      });

      showSnackbar("success", "Datos complementarios actualizados correctamente.");
      setEditOpen(false);
      setSelectedLead(null);
      await fetchLeads();
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        "error",
        error?.response?.data?.message || "No se pudo actualizar el lead."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleRecheck = async (lead: DirectoLead) => {
    try {
      await recheckDirectoLead(lead.id);
      showSnackbar("success", "Consulta actualizada correctamente.");
      await fetchLeads();
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        "error",
        error?.response?.data?.message || "No se pudo reconsultar el lead."
      );
    }
  };

  const handleDelete = async (lead: DirectoLead) => {
    const ok = window.confirm(
      `¿Querés eliminar el lead de ${lead.fullName || "este cliente"}?`
    );
    if (!ok) return;

    try {
      await deleteDirectoLead(lead.id);
      showSnackbar("success", "Lead eliminado correctamente.");
      await fetchLeads();
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        "error",
        error?.response?.data?.message || "No se pudo eliminar el lead."
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Créditos Directo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta de elegibilidad por DNI y género para préstamos personales de moto.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<CreditScoreIcon />}
          onClick={handleOpenConsult}
        >
          Nueva consulta
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar por DNI / nombre / teléfono / email"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value as DirectoLeadStatus | "",
                      page: 1,
                    }))
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="approved">Aprobado</MenuItem>
                  <MenuItem value="rejected">Rechazado</MenuItem>
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: e.target.value,
                    page: 1,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateTo: e.target.value,
                    page: 1,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Stack direction="row" spacing={1} height="100%">
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={fetchLeads}
                >
                  Buscar
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setFilters(initialFilters)}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Género</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Monto máximo aprobado</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Validado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      No hay resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.id}</TableCell>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      <TableCell>{lead.dni}</TableCell>
                      <TableCell>{lead.gender}</TableCell>
                      <TableCell>{lead.fullName || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getStatusLabel(lead.status)}
                          color={getStatusColor(lead.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontWeight={lead.status === "approved" ? 700 : 400}
                        >
                          {formatCurrency(lead.maxApprovedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{lead.phone || "-"}</TableCell>
                      <TableCell>{lead.email || "-"}</TableCell>
                      <TableCell>{formatDate(lead.validatedAt)}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Reconsultar">
                            <IconButton
                              size="small"
                              onClick={() => handleRecheck(lead)}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar datos complementarios">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(lead)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(lead)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total registros: {total}
            </Typography>

            <Pagination
              page={filters.page}
              count={totalPages}
              color="primary"
              onChange={(_, page) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                }))
              }
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={consultOpen}
        onClose={handleCloseConsult}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva consulta Directo</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="DNI"
              value={consultForm.dni}
              onChange={(e) =>
                setConsultForm((prev) => ({
                  ...prev,
                  dni: normalizeDni(e.target.value),
                }))
              }
              inputProps={{ maxLength: 8 }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Género</InputLabel>
              <Select
                label="Género"
                value={consultForm.gender}
                onChange={(e) =>
                  setConsultForm((prev) => ({
                    ...prev,
                    gender: e.target.value as DirectoGender,
                  }))
                }
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Femenino</MenuItem>
              </Select>
            </FormControl>

            {consultResult && (
              <>
                <Divider />

                <Alert
                  severity={
                    consultResult.status === "approved"
                      ? "success"
                      : consultResult.status === "rejected"
                      ? "warning"
                      : consultResult.status === "error"
                      ? "error"
                      : "info"
                  }
                >
                  {consultResult.message || "Consulta realizada."}
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Estado"
                      value={getStatusLabel(consultResult.status)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha de validación"
                      value={formatDate(consultResult.validatedAt)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Nombre validado"
                      value={consultResult.fullName || "-"}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Monto máximo aprobado"
                      value={formatCurrency(consultResult.maxApprovedAmount)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>

                {consultResult.status === "approved" && (
                  <Alert severity="info">
                    Ahora podés cerrar esta ventana y completar teléfono, email,
                    domicilio y observaciones desde el listado usando el botón editar.
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseConsult} disabled={consultSubmitting}>
            Cerrar
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmitConsult}
            disabled={consultSubmitting}
            startIcon={
              consultSubmitting ? <CircularProgress size={18} /> : <CreditScoreIcon />
            }
          >
            {consultSubmitting ? "Consultando..." : "Consultar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Editar datos complementarios
          {selectedLead ? ` #${selectedLead.id}` : ""}
        </DialogTitle>

        <DialogContent dividers>
          {selectedLead && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="DNI"
                    value={selectedLead.dni}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Género"
                    value={selectedLead.gender === "M" ? "Masculino" : "Femenino"}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Estado"
                    value={getStatusLabel(selectedLead.status)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre validado"
                    value={selectedLead.fullName || "-"}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Monto máximo aprobado"
                    value={formatCurrency(selectedLead.maxApprovedAmount)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle1" fontWeight={700}>
                Datos complementarios
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Teléfono"
                    fullWidth
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Domicilio"
                    fullWidth
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Observaciones"
                    fullWidth
                    multiline
                    minRows={4}
                    value={editForm.observations}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        observations: e.target.value,
                      }))
                    }
                    placeholder="Moto deseada, versión, año, valor estimado, anticipo, comentarios del vendedor, etc."
                  />
                </Grid>
              </Grid>

              {selectedLead.statusMessage && (
                <Alert severity="info">{selectedLead.statusMessage}</Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={editSubmitting}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmitEdit}
            disabled={editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={18} /> : undefined}
          >
            {editSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DirectoLeads;