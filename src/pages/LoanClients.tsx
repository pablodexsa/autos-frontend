import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useSnackbar } from "notistack";
import {
  createLoanClient,
  getLoanClientDocumentUrl,
  getLoanClients,
  LoanClient,
  updateLoanClient,
  uploadLoanClientDocument,
} from "../api/loanModules";

type FormState = {
  firstName: string;
  lastName: string;
  cuitCuil: string;
  workAddress: string;
  aliasOrCbu: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  cuitCuil: "",
  workAddress: "",
  aliasOrCbu: "",
};

const docLabels = [
  { key: "dni", label: "DNI", pathKey: "dniPhotoPath" },
  { key: "business", label: "Comercio", pathKey: "businessPhotoPath" },
  { key: "service_bill", label: "Servicio", pathKey: "serviceBillPath" },
  { key: "bank_account", label: "Cuenta bancaria", pathKey: "bankAccountPath" },
] as const;

export default function LoanClients() {
  const { enqueueSnackbar } = useSnackbar();

  const [clients, setClients] = useState<LoanClient[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    cuitCuil: "",
    firstName: "",
    lastName: "",
    aliasOrCbu: "",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoanClient | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const title = useMemo(
    () => (editing ? "Editar cliente préstamo" : "Nuevo cliente préstamo"),
    [editing],
  );

  async function loadClients() {
    try {
      setLoading(true);
      const data = await getLoanClients(filters);
      setClients(data);
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al cargar clientes préstamos",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(client: LoanClient) {
    setEditing(client);
    setForm({
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      cuitCuil: client.cuitCuil || "",
      workAddress: client.workAddress || "",
      aliasOrCbu: client.aliasOrCbu || "",
    });
    setOpen(true);
  }

  async function handleSubmit() {
    try {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.cuitCuil.trim()) {
        enqueueSnackbar("Nombre, apellido y CUIT/CUIL son obligatorios", {
          variant: "warning",
        });
        return;
      }

      if (editing) {
        await updateLoanClient(editing.id, form);
        enqueueSnackbar("Cliente actualizado correctamente", {
          variant: "success",
        });
      } else {
        await createLoanClient(form);
        enqueueSnackbar("Cliente creado correctamente", {
          variant: "success",
        });
      }

      setOpen(false);
      await loadClients();
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al guardar cliente",
        { variant: "error" },
      );
    }
  }

  async function handleUpload(
    client: LoanClient,
    docType: "dni" | "business" | "service_bill" | "bank_account",
    file?: File,
  ) {
    if (!file) return;

    try {
      await uploadLoanClientDocument(client.id, docType, file);
      enqueueSnackbar("Adjunto subido correctamente", { variant: "success" });
      await loadClients();
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Error al subir adjunto",
        { variant: "error" },
      );
    }
  }

  function openDocument(
    client: LoanClient,
    docType: "dni" | "business" | "service_bill" | "bank_account",
  ) {
    window.open(getLoanClientDocumentUrl(client.id, docType), "_blank");
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" color="white" fontWeight={700}>
            Clientes Préstamos
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Base separada de clientes para préstamos personales.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ backgroundColor: "#00BFA5" }}
        >
          Nuevo cliente
        </Button>
      </Stack>

      <Card sx={{ mb: 3, background: "rgba(255,255,255,0.08)", color: "white" }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Filtros
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar general"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="CUIT/CUIL"
                value={filters.cuitCuil}
                onChange={(e) =>
                  setFilters({ ...filters, cuitCuil: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Nombre"
                value={filters.firstName}
                onChange={(e) =>
                  setFilters({ ...filters, firstName: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Apellido"
                value={filters.lastName}
                onChange={(e) =>
                  setFilters({ ...filters, lastName: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Alias/CBU"
                value={filters.aliasOrCbu}
                onChange={(e) =>
                  setFilters({ ...filters, aliasOrCbu: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadClients}
                sx={{ height: "56px", backgroundColor: "#00BFA5" }}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ backgroundColor: "#171717", color: "white" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#1e1e1e" }}>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>CUIT/CUIL</TableCell>
              <TableCell>Dirección laboral</TableCell>
              <TableCell>Alias/CBU</TableCell>
              <TableCell>Adjuntos</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} hover>
                <TableCell>
                  {client.firstName} {client.lastName}
                </TableCell>
                <TableCell>{client.cuitCuil}</TableCell>
                <TableCell>{client.workAddress || "-"}</TableCell>
                <TableCell>{client.aliasOrCbu || "-"}</TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {docLabels.map((doc) => {
                      const hasDoc = Boolean((client as any)[doc.pathKey]);

                      return (
                        <Stack
                          key={doc.key}
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ mr: 1, mb: 1 }}
                        >
                          <Chip
                            size="small"
                            label={doc.label}
                            color={hasDoc ? "success" : "default"}
                          />

                          <IconButton size="small" component="label">
                            <UploadFileIcon fontSize="small" />
                            <input
                              hidden
                              type="file"
                              onChange={(e) =>
                                handleUpload(
                                  client,
                                  doc.key,
                                  e.target.files?.[0],
                                )
                              }
                            />
                          </IconButton>

                          {hasDoc && (
                            <IconButton
                              size="small"
                              onClick={() => openDocument(client, doc.key)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </TableCell>

                <TableCell align="right">
                  <IconButton onClick={() => openEdit(client)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {!clients.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {loading ? "Cargando..." : "No hay clientes para mostrar."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre"
              fullWidth
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />

            <TextField
              label="Apellido"
              fullWidth
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />

            <TextField
              label="CUIT/CUIL"
              fullWidth
              value={form.cuitCuil}
              onChange={(e) => setForm({ ...form, cuitCuil: e.target.value })}
            />

            <TextField
              label="Dirección laboral"
              fullWidth
              value={form.workAddress}
              onChange={(e) => setForm({ ...form, workAddress: e.target.value })}
            />

            <TextField
              label="Alias/CBU"
              fullWidth
              value={form.aliasOrCbu}
              onChange={(e) => setForm({ ...form, aliasOrCbu: e.target.value })}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}