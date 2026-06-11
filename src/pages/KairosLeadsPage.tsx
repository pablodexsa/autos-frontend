import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

type KairosLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_ANALYSIS"
  | "PRE_APPROVED"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED";

type KairosLeadSource =
  | "META_ADS"
  | "WHATSAPP_ORGANIC"
  | "INSTAGRAM"
  | "REFERRED"
  | "WEB"
  | "MANUAL";

interface KairosLead {
  id: number;
  fullName: string;
  cuitCuil: string;
  phone: string;
  businessAddress: string;
  businessType?: string | null;
  businessAge?: string | null;
  requestedAmount: number | string;
  source: KairosLeadSource;
  status: KairosLeadStatus;
  notes?: string | null;
  campaign?: string | null;
  adName?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  bcraStatus?: string | null;
  verazStatus?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface KairosLeadsResponse {
  items: KairosLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FormState {
  fullName: string;
  cuitCuil: string;
  phone: string;
  businessAddress: string;
  businessType: string;
  businessAge: string;
  requestedAmount: string;
  source: KairosLeadSource;
  status: KairosLeadStatus;
  notes: string;
  campaign: string;
  adName: string;
  utmSource: string;
  utmCampaign: string;
  utmContent: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_LABELS: Record<KairosLeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  IN_ANALYSIS: "En análisis",
  PRE_APPROVED: "Pre aprobado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  DISBURSED: "Desembolsado",
};

const SOURCE_LABELS: Record<KairosLeadSource, string> = {
  META_ADS: "Meta Ads",
  WHATSAPP_ORGANIC: "WhatsApp orgánico",
  INSTAGRAM: "Instagram",
  REFERRED: "Referido",
  WEB: "Web",
  MANUAL: "Manual",
};

const EMPTY_FORM: FormState = {
  fullName: "",
  cuitCuil: "",
  phone: "",
  businessAddress: "",
  businessType: "",
  businessAge: "",
  requestedAmount: "",
  source: "MANUAL",
  status: "NEW",
  notes: "",
  campaign: "",
  adName: "",
  utmSource: "",
  utmCampaign: "",
  utmContent: "",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusColor(status: KairosLeadStatus) {
  switch (status) {
    case "NEW":
      return "info";
    case "CONTACTED":
      return "primary";
    case "IN_ANALYSIS":
      return "warning";
    case "PRE_APPROVED":
      return "secondary";
    case "APPROVED":
    case "DISBURSED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
}

export default function KairosLeadsPage() {
  const [items, setItems] = useState<KairosLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<KairosLeadStatus | "">("");
  const [source, setSource] = useState<KairosLeadSource | "">("");

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<KairosLead | null>(null);
  const [selectedLead, setSelectedLead] = useState<KairosLead | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page + 1));
    params.set("limit", String(limit));

    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (source) params.set("source", source);

    return params.toString();
  }, [page, limit, q, status, source]);

  async function fetchLeads() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/kairos-leads?${queryString}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("No se pudieron obtener los leads de Kairos");
      }

      const data: KairosLeadsResponse = await response.json();

      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los leads de Kairos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function openCreateModal() {
    setEditingLead(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(lead: KairosLead) {
    setEditingLead(lead);
    setForm({
      fullName: lead.fullName || "",
      cuitCuil: lead.cuitCuil || "",
      phone: lead.phone || "",
      businessAddress: lead.businessAddress || "",
      businessType: lead.businessType || "",
      businessAge: lead.businessAge || "",
      requestedAmount: String(lead.requestedAmount || ""),
      source: lead.source || "MANUAL",
      status: lead.status || "NEW",
      notes: lead.notes || "",
      campaign: lead.campaign || "",
      adName: lead.adName || "",
      utmSource: lead.utmSource || "",
      utmCampaign: lead.utmCampaign || "",
      utmContent: lead.utmContent || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLead(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(
    field: keyof FormState,
    value: string | KairosLeadStatus | KairosLeadSource,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.fullName.trim()) return "Ingresá el nombre completo.";
    if (!form.cuitCuil.trim()) return "Ingresá el CUIT/CUIL.";
    if (!form.phone.trim()) return "Ingresá el teléfono.";
    if (!form.businessAddress.trim()) return "Ingresá la dirección del comercio.";
    if (!form.requestedAmount || Number(form.requestedAmount) <= 0) {
      return "Ingresá un monto solicitado válido.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        requestedAmount: Number(form.requestedAmount),
        businessType: form.businessType || null,
        businessAge: form.businessAge || null,
        notes: form.notes || null,
        campaign: form.campaign || null,
        adName: form.adName || null,
        utmSource: form.utmSource || null,
        utmCampaign: form.utmCampaign || null,
        utmContent: form.utmContent || null,
      };

      const url = editingLead
        ? `${API_URL}/kairos-leads/${editingLead.id}`
        : `${API_URL}/kairos-leads`;

      const method = editingLead ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el lead");
      }

      closeModal();
      fetchLeads();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el lead de Kairos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    lead: KairosLead,
    nextStatus: KairosLeadStatus,
  ) {
    try {
      setError(null);

      const response = await fetch(
        `${API_URL}/kairos-leads/${lead.id}/status/${nextStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo actualizar el estado");
      }

      fetchLeads();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado del lead.");
    }
  }

  async function handleDelete(lead: KairosLead) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar el lead de ${lead.fullName}?`,
    );

    if (!confirmed) return;

    try {
      setError(null);

      const response = await fetch(`${API_URL}/kairos-leads/${lead.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el lead");
      }

      fetchLeads();

      if (selectedLead?.id === lead.id) {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el lead.");
    }
  }

async function handleBcraCheck(lead: KairosLead) {
  try {
    setError(null);

    const response = await fetch(
      `${API_URL}/kairos-leads/${lead.id}/bcra-check`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("No se pudo consultar BCRA");
    }

    await fetchLeads();

    if (selectedLead?.id === lead.id) {
      const updated = await response.json();
      setSelectedLead(updated);
    }
  } catch (err) {
    console.error(err);
    setError("No se pudo consultar BCRA.");
  }
}

  function resetFilters() {
    setQ("");
    setStatus("");
    setSource("");
    setPage(0);
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="white">
            Kairos
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            Leads comerciales para solicitudes de préstamos.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          sx={{
            backgroundColor: "#00BFA5",
            color: "#fff",
            fontWeight: 700,
            "&:hover": { backgroundColor: "#00d9b8" },
          }}
        >
          Nuevo lead
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Nombre, CUIT/CUIL, teléfono, dirección..."
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as KairosLeadStatus | "");
                setPage(0);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Origen"
              value={source}
              onChange={(e) => {
                setSource(e.target.value as KairosLeadSource | "");
                setPage(0);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={1}>
            <Button fullWidth variant="outlined" onClick={resetFilters}>
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          backgroundColor: "#1e1e2f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography variant="body2" color="rgba(255,255,255,0.75)">
            Total de leads: <strong>{total}</strong>
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#2a2a3b" }}>
                <TableCell>Cliente</TableCell>
                <TableCell>CUIT/CUIL</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Rubro</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>BCRA</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                    No hay leads para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((lead) => (
                  <TableRow
                    key={lead.id}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(0,191,165,0.08)",
                      },
                    }}
                  >
                    <TableCell>{lead.fullName}</TableCell>
                    <TableCell>{lead.cuitCuil}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.businessType || "-"}</TableCell>
                    <TableCell>{formatCurrency(lead.requestedAmount)}</TableCell>
                    <TableCell>{SOURCE_LABELS[lead.source]}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(
                            lead,
                            e.target.value as KairosLeadStatus,
                          )
                        }
                        sx={{ minWidth: 145 }}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <MenuItem key={key} value={key}>
                            {label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
{lead.bcraStatus ? (
  <Chip
    size="small"
    label={lead.bcraStatus}
    color={
      lead.bcraStatus === "ERROR"
        ? "error"
        : lead.bcraStatus.includes("SITUACION")
          ? "success"
          : "warning"
    }
  />
) : (
  "-"
)}
                    </TableCell>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalle">
                        <IconButton onClick={() => setSelectedLead(lead)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

<Tooltip title="Consultar BCRA">
  <IconButton
    color="primary"
    onClick={() => handleBcraCheck(lead)}
  >
    <SearchIcon />
  </IconButton>
</Tooltip>

                      <Tooltip title="Editar">
                        <IconButton onClick={() => openEditModal(lead)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(lead)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página"
        />
      </Paper>

      <Dialog open={showModal} onClose={closeModal} fullWidth maxWidth="md">
        <DialogTitle>
          {editingLead ? "Editar lead Kairos" : "Nuevo lead Kairos"}
        </DialogTitle>

        <DialogContent dividers>
          <Box component="form" id="kairos-lead-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CUIT/CUIL"
                  value={form.cuitCuil}
                  onChange={(e) => handleChange("cuitCuil", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto solicitado"
                  value={form.requestedAmount}
                  onChange={(e) => handleChange("requestedAmount", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección del comercio"
                  value={form.businessAddress}
                  onChange={(e) => handleChange("businessAddress", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rubro"
                  value={form.businessType}
                  onChange={(e) => handleChange("businessType", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Antigüedad"
                  value={form.businessAge}
                  onChange={(e) => handleChange("businessAge", e.target.value)}
                  placeholder="Ej: Más de 3 años"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Origen"
                  value={form.source}
                  onChange={(e) =>
                    handleChange("source", e.target.value as KairosLeadSource)
                  }
                >
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={form.status}
                  onChange={(e) =>
                    handleChange("status", e.target.value as KairosLeadStatus)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Campaña"
                  value={form.campaign}
                  onChange={(e) => handleChange("campaign", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Anuncio"
                  value={form.adName}
                  onChange={(e) => handleChange("adName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="UTM Source"
                  value={form.utmSource}
                  onChange={(e) => handleChange("utmSource", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="UTM Campaign"
                  value={form.utmCampaign}
                  onChange={(e) => handleChange("utmCampaign", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="UTM Content"
                  value={form.utmContent}
                  onChange={(e) => handleChange("utmContent", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Observaciones"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button
            type="submit"
            form="kairos-lead-form"
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: "#00BFA5",
              "&:hover": { backgroundColor: "#00d9b8" },
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Detalle del lead Kairos</DialogTitle>

        <DialogContent dividers>
          {selectedLead && (
            <Grid container spacing={2}>
              <Detail label="Nombre" value={selectedLead.fullName} />
              <Detail label="CUIT/CUIL" value={selectedLead.cuitCuil} />
              <Detail label="Teléfono" value={selectedLead.phone} />
              <Detail
                label="Monto solicitado"
                value={formatCurrency(selectedLead.requestedAmount)}
              />
              <Detail label="Dirección" value={selectedLead.businessAddress} />
              <Detail label="Rubro" value={selectedLead.businessType || "-"} />
              <Detail label="Antigüedad" value={selectedLead.businessAge || "-"} />
              <Detail label="Origen" value={SOURCE_LABELS[selectedLead.source]} />
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={STATUS_LABELS[selectedLead.status]}
                      color={statusColor(selectedLead.status) as any}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>
              <Detail label="BCRA" value={selectedLead.bcraStatus || "-"} />
              <Detail label="Veraz" value={selectedLead.verazStatus || "-"} />
              <Detail label="Campaña" value={selectedLead.campaign || "-"} />
              <Detail label="Anuncio" value={selectedLead.adName || "-"} />
              <Detail label="UTM Source" value={selectedLead.utmSource || "-"} />
              <Detail label="UTM Campaign" value={selectedLead.utmCampaign || "-"} />
              <Detail label="UTM Content" value={selectedLead.utmContent || "-"} />
              <Detail label="Creado" value={formatDate(selectedLead.createdAt)} />
              <Detail label="Actualizado" value={formatDate(selectedLead.updatedAt)} />

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedLead.notes || "Sin observaciones"}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          {selectedLead && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                const lead = selectedLead;
                setSelectedLead(null);
                openEditModal(lead);
              }}
            >
              Editar
            </Button>
          )}

          <Button onClick={() => setSelectedLead(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} md={6}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </Paper>
    </Grid>
  );
}