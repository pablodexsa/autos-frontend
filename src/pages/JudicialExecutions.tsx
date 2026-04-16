import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  getJudicialExecutions,
  getJudicialPreview,
  createJudicialExecution,
  searchClients,
  getJudicialExecutionById,
  closeJudicialExecution,
  getJudicialClientSales,
} from "../api/judicialExecutions";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR").format(d);
};

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "error";
    case "CLOSED":
      return "success";
    default:
      return "default";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Activa";
    case "CLOSED":
      return "Cerrada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status || "-";
  }
}

function getClientLabel(client: any) {
  if (!client) return "-";
  return (
    client.fullName ||
    client.name ||
    [client.firstName, client.lastName].filter(Boolean).join(" ") ||
    "-"
  );
}

type StatusFilter = "ALL" | "ACTIVE" | "CLOSED" | "CANCELLED";

export default function JudicialExecutions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [salesOptions, setSalesOptions] = useState<any[]>([]);
  const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [closingExecution, setClosingExecution] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getJudicialExecutions();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Error al cargar ejecuciones judiciales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : row.status === statusFilter;

      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      const clientLabel = getClientLabel(row.client).toLowerCase();
      const dni = String(row.client?.dni || "").toLowerCase();
      const lawFirm = String(row.lawFirmName || "Vazquez Abogados").toLowerCase();
      const status = getStatusLabel(row.status).toLowerCase();
      const amount = String(row.executedNetAmount || "").toLowerCase();

      return (
        clientLabel.includes(normalizedSearch) ||
        dni.includes(normalizedSearch) ||
        lawFirm.includes(normalizedSearch) ||
        status.includes(normalizedSearch) ||
        amount.includes(normalizedSearch)
      );
    });
  }, [rows, search, statusFilter]);

  const resetCreateModal = () => {
    setSelectedClient(null);
    setClientOptions([]);
    setSalesOptions([]);
    setSelectedSaleIds([]);
    setPreview(null);
    setNotes("");
    setError("");
  };

  const handleOpenCreate = () => {
    resetCreateModal();
    setOpenCreateModal(true);
  };

  const handleCloseCreate = () => {
    setOpenCreateModal(false);
    resetCreateModal();
  };

  const handleSearchClients = async (value: string) => {
    if (value.length < 2) {
      setClientOptions([]);
      return;
    }

    try {
      const results = await searchClients(value);
      setClientOptions(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectClient = async (client: any | null) => {
    setSelectedClient(client);
    setPreview(null);
    setSalesOptions([]);
    setSelectedSaleIds([]);

    if (!client?.id) return;

    try {
      setSalesLoading(true);
      setError("");
      const data = await getJudicialClientSales(client.id);
      setSalesOptions(Array.isArray(data?.sales) ? data.sales : []);
    } catch (err: any) {
      setSalesOptions([]);
      setError(
        err?.response?.data?.message ||
          "Error al obtener los vehículos con deuda del cliente"
      );
    } finally {
      setSalesLoading(false);
    }
  };

  const toggleSaleSelection = (saleId: number) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!selectedClient || !selectedSaleIds.length) return;

    try {
      setPreviewLoading(true);
      setError("");
      const data = await getJudicialPreview(selectedClient.id, selectedSaleIds);
      setPreview(data);
    } catch (err: any) {
      setPreview(null);
      setError(
        err?.response?.data?.message || "Error al obtener el preview judicial"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedClient || !selectedSaleIds.length || !preview) return;

    try {
      setCreating(true);
      setError("");

      await createJudicialExecution({
        clientId: selectedClient.id,
        saleIds: selectedSaleIds,
        lawFirmName: "Vazquez Abogados",
        notes: notes.trim() || undefined,
      });

      handleCloseCreate();
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Error al crear la ejecución judicial"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setDetailError("");
      setDetailLoading(true);
      setOpenDetailModal(true);

      const data = await getJudicialExecutionById(id);
      setSelectedExecution(data);
    } catch (err: any) {
      setSelectedExecution(null);
      setDetailError(
        err?.response?.data?.message || "Error al cargar el detalle"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetailModal(false);
    setSelectedExecution(null);
    setDetailError("");
  };

  const handleCloseExecution = async () => {
    if (!selectedExecution?.id) return;

    try {
      setClosingExecution(true);
      await closeJudicialExecution(selectedExecution.id);
      await loadData();

      const refreshed = await getJudicialExecutionById(selectedExecution.id);
      setSelectedExecution(refreshed);
    } catch (err: any) {
      setDetailError(
        err?.response?.data?.message || "Error al cerrar la ejecución"
      );
    } finally {
      setClosingExecution(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800}>
        Ejecuciones Judiciales
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={loadData} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>

        <Button variant="contained" color="error" onClick={handleOpenCreate}>
          Nueva ejecución judicial
        </Button>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mt: 2 }}
      >
        <TextField
          label="Buscar por cliente, DNI, estudio o estado"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />

        <FormControl sx={{ minWidth: { xs: "100%", md: 220 } }}>
          <InputLabel id="judicial-status-filter-label">Estado</InputLabel>
          <Select
            labelId="judicial-status-filter-label"
            value={statusFilter}
            label="Estado"
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="ALL">Todas</MenuItem>
            <MenuItem value="ACTIVE">Activas</MenuItem>
            <MenuItem value="CLOSED">Cerradas</MenuItem>
            <MenuItem value="CANCELLED">Canceladas</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Casos judiciales
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredRows.length} de {rows.length} casos
            </Typography>
          </Stack>

          <Paper sx={{ overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha inicio</TableCell>
                  <TableCell align="right">Cuotas</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Estudio</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleOpenDetail(row.id)}
                  >
                    <TableCell>{getClientLabel(row.client)}</TableCell>

                    <TableCell>{formatDate(row.startedAt)}</TableCell>

                    <TableCell align="right">
                      {row.affectedInstallmentsCount}
                    </TableCell>

                    <TableCell align="right">
                      {formatCurrency(Number(row.executedNetAmount))}
                    </TableCell>

                    <TableCell>
                      {row.lawFirmName || "Vazquez Abogados"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(row.status)}
                        color={getStatusColor(row.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {!filteredRows.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay ejecuciones judiciales para los filtros aplicados
                    </TableCell>
                  </TableRow>
                )}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>

      <Dialog
        open={openCreateModal}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva ejecución judicial</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={clientOptions}
              value={selectedClient}
              getOptionLabel={(option) => {
                const name =
                  option.fullName ||
                  option.name ||
                  [option.firstName, option.lastName].filter(Boolean).join(" ");
                return `${name || "Sin nombre"} - ${option.dni || ""}`;
              }}
              onInputChange={(_, value) => handleSearchClients(value)}
              onChange={(_, value) => handleSelectClient(value)}
              renderInput={(params) => (
                <TextField {...params} label="Buscar cliente" fullWidth />
              )}
            />

            {selectedClient && (
              <Typography fontWeight={700}>
                Cliente seleccionado: {getClientLabel(selectedClient)}
              </Typography>
            )}

            {salesLoading ? (
              <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={26} />
              </Box>
            ) : !!selectedClient && (
              <Paper sx={{ overflow: "hidden" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Patente</TableCell>
                      <TableCell>Vehículo</TableCell>
                      <TableCell>Fecha venta</TableCell>
                      <TableCell align="right">Cuotas</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {salesOptions.map((sale: any) => (
                      <TableRow key={sale.saleId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedSaleIds.includes(sale.saleId)}
                            onChange={() => toggleSaleSelection(sale.saleId)}
                          />
                        </TableCell>

                        <TableCell>{sale.plate || "-"}</TableCell>
                        <TableCell>{sale.vehicleLabel || "-"}</TableCell>
                        <TableCell>{formatDate(sale.saleCreatedAt)}</TableCell>
                        <TableCell align="right">
                          {sale.installmentsCount ?? 0}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(sale.pendingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {!salesOptions.length && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          El cliente no tiene vehículos con deuda judicializable
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            )}

            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={
                !selectedClient ||
                !selectedSaleIds.length ||
                previewLoading ||
                creating
              }
            >
              {previewLoading ? "Consultando..." : "Ver deuda seleccionada"}
            </Button>

            {preview && (
              <>
                <Typography fontWeight={700}>
                  Cliente: {preview.clientName}
                </Typography>

                <Typography>
                  Vehículos / operaciones seleccionadas:{" "}
                  {selectedSaleIds.length}
                </Typography>

                <Typography>
                  Cuotas afectadas: {preview.installmentsCount}
                </Typography>

                <Typography fontWeight={700}>
                  Total a ejecutar: {formatCurrency(preview.executedNetAmount)}
                </Typography>

                <TextField
                  label="Observaciones"
                  fullWidth
                  multiline
                  minRows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <Paper sx={{ mt: 1, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Patente</TableCell>
                        <TableCell>Vehículo</TableCell>
                        <TableCell>Cuota</TableCell>
                        <TableCell>Vencimiento</TableCell>
                        <TableCell align="right">Importe</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell align="right">Neto judicial</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {preview.installments?.map((inst: any) => (
                        <TableRow key={inst.id}>
                          <TableCell>{inst.plate || "-"}</TableCell>
                          <TableCell>{inst.vehicleLabel || "-"}</TableCell>
                          <TableCell>{inst.installmentNumber ?? "-"}</TableCell>
                          <TableCell>{formatDate(inst.dueDate)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(inst.amount)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(inst.remainingAmount)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(inst.judicialNetAmount)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {!preview.installments?.length && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Sin cuotas para mostrar
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancelar</Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleCreate}
            disabled={!preview || creating}
          >
            {creating ? "Creando..." : "Confirmar ejecución"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDetailModal}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalle de ejecución judicial</DialogTitle>

        <DialogContent>
          {detailLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {detailError}
            </Alert>
          ) : selectedExecution ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography fontWeight={700}>
                    {getClientLabel(selectedExecution.client)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha inicio
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatDate(selectedExecution.startedAt)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedExecution.status)}
                    color={getStatusColor(selectedExecution.status)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estudio
                  </Typography>
                  <Typography fontWeight={700}>
                    {selectedExecution.lawFirmName || "Vazquez Abogados"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cuotas afectadas
                  </Typography>
                  <Typography fontWeight={700}>
                    {selectedExecution.affectedInstallmentsCount ?? 0}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto ejecutado
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatCurrency(selectedExecution.executedNetAmount)}
                  </Typography>
                </Box>
              </Stack>

              {selectedExecution.notes ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography fontWeight={500}>
                    {selectedExecution.notes}
                  </Typography>
                </Box>
              ) : null}

              <Paper sx={{ overflow: "hidden" }}>
                <Table size="small">
<TableHead>
  <TableRow>
    <TableCell>Patente</TableCell>
    <TableCell>Cuota</TableCell>
    <TableCell>Vencimiento</TableCell>
    <TableCell align="right">Importe</TableCell>
    <TableCell align="right">Saldo actual</TableCell>
    <TableCell align="right">Neto judicial</TableCell>
  </TableRow>
</TableHead>

                  <TableBody>
{selectedExecution.installments?.map((inst: any) => (
  <TableRow key={inst.id}>
    <TableCell>{inst.sale?.vehicle?.plate || "-"}</TableCell>
    <TableCell>{inst.installmentNumber ?? "-"}</TableCell>
    <TableCell>{formatDate(inst.dueDate)}</TableCell>
    <TableCell align="right">
      {formatCurrency(inst.amount)}
    </TableCell>
    <TableCell align="right">
      {formatCurrency(inst.remainingAmount)}
    </TableCell>
    <TableCell align="right" sx={{ fontWeight: 700 }}>
      {formatCurrency(inst.judicialNetAmount)}
    </TableCell>
  </TableRow>
))}

                    {!selectedExecution.installments?.length && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Esta ejecución no tiene cuotas asociadas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>
              No hay información para mostrar.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          {selectedExecution?.status === "ACTIVE" && (
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseExecution}
              disabled={closingExecution}
            >
              {closingExecution ? "Cerrando..." : "Cerrar ejecución"}
            </Button>
          )}

          <Button onClick={handleCloseDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}