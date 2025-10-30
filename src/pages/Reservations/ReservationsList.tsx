import React, { useEffect, useState } from "react";
import {
  listReservations,
  getReservationPdf,
  updateReservationStatus,
} from "../../api/reservations";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  TableContainer,
  Tooltip,
  Typography,
  Chip,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";

export const ReservationsList: React.FC<{ onEdit: (r: any) => void }> = ({ onEdit }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const load = async () => {
    const data = await listReservations();
    setRows(data);
    setFilteredRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePdf = async (id: number) => {
    const { url } = await getReservationPdf(id);
    window.open(url, "_blank");
  };

  const handleStatus = async (id: number, status: "Aceptada" | "Cancelada") => {
    await updateReservationStatus(id, status);
    await load();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🔹 Aplicar filtros
  const applyFilters = () => {
    let filtered = [...rows];

    if (statusFilter !== "Todos") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(
        (r) => r.updatedAt && new Date(r.updatedAt) >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate);
      filtered = filtered.filter(
        (r) => r.updatedAt && new Date(r.updatedAt) <= to
      );
    }

    setFilteredRows(filtered);
  };

  const resetFilters = () => {
    setStatusFilter("Todos");
    setFromDate("");
    setToDate("");
    setFilteredRows(rows);
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* 🧭 Filtros */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#2a2a3b",
          borderRadius: 2,
          color: "#fff",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: "#00BFA5" }}>
          Filtros
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#ccc" }}>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ color: "#fff" }}
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Vigente">Vigente</MenuItem>
                <MenuItem value="Vencida">Vencida</MenuItem>
                <MenuItem value="Cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Desde"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                input: { color: "#fff" },
                label: { color: "#ccc" },
                width: "100%",
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Hasta"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                input: { color: "#fff" },
                label: { color: "#ccc" },
                width: "100%",
              }}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={3}
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            gap={1}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={applyFilters}
              sx={{ textTransform: "none" }}
            >
              Aplicar filtros
            </Button>
            <Tooltip title="Reiniciar filtros">
              <Button
                variant="outlined"
                color="secondary"
                onClick={resetFilters}
              >
                <RefreshIcon />
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* 🧾 Tabla */}
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: "#1e1e2f", borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Cliente (DNI)</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Vehículo</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Fecha</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Estado</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Última actualización</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Documentación</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Acción</TableCell>
              <TableCell sx={{ color: "#00bfa5", fontWeight: 600 }}>Editar</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((r) => {
              const autoUpdated =
                r.status === "Vencida" || r.status === "VigenteExtendida" || r.autoUpdated;

              return (
                <TableRow key={r.id} hover sx={{ backgroundColor: "#2a2a3b" }}>
                  <TableCell sx={{ color: "#fff" }}>{r.id}</TableCell>

                  <TableCell sx={{ color: "#fff" }}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {r.clientName || `${r.client?.firstName ?? ""} ${r.client?.lastName ?? ""}`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>
                      {r.clientDni || r.client?.dni || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ color: "#fff" }}>
                    {r.vehicle
                      ? r.vehicleLabel ||
                        `${r.vehicle?.brand ?? ""} ${r.vehicle?.model ?? ""} (${r.vehicle?.plate ?? ""})`
                      : "-"}
                  </TableCell>

                  <TableCell sx={{ color: "#fff" }}>{formatDate(r.date)}</TableCell>

                  <TableCell>
                    <Chip
                      label={r.status}
                      color={
                        r.status === "Vigente"
                          ? "success"
                          : r.status === "Vencida"
                          ? "warning"
                          : r.status === "Cancelada"
                          ? "error"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell sx={{ color: "#fff" }}>
                    {r.updatedAt ? (
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon sx={{ fontSize: 18, color: "#bbb" }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: autoUpdated ? "#bbb" : "#fff",
                              fontStyle: autoUpdated ? "italic" : "normal",
                            }}
                          >
                            {formatDate(r.updatedAt)}
                          </Typography>
                        </Box>
                        {autoUpdated && (
                          <Chip
                            label="Automática"
                            size="small"
                            sx={{
                              backgroundColor: "#555",
                              color: "#eee",
                              width: "fit-content",
                              fontSize: "0.75rem",
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Descargar comprobante PDF">
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => handlePdf(r.id)}
                      >
                        PDF
                      </Button>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      color="success"
                      variant="contained"
                      onClick={() => handleStatus(r.id, "Aceptada")}
                      sx={{ mr: 1 }}
                    >
                      Aceptar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => handleStatus(r.id, "Cancelada")}
                    >
                      Cancelar
                    </Button>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => onEdit(r)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
