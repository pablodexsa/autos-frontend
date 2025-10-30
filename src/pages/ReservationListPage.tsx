import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Guarantor {
  firstName: string;
  lastName: string;
  dni: string;
  address?: string;
  phone?: string;
  dniFilePath?: string;
  payslipFilePath?: string;
}

interface Reservation {
  id: number;
  clientDni: string;
  clientName: string;
  vehicle: string;
  plate: string;
  date: string;
  status: string;
  guarantors?: Guarantor[];
}

const ReservationListPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [openGuarantors, setOpenGuarantors] = useState(false);
  const [selectedGuarantors, setSelectedGuarantors] = useState<Guarantor[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  const navigate = useNavigate();

  // 🔹 Cargar listado de reservas
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/reservations");
      setReservations(res.data);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // 🔹 Descargar PDF de reserva (abre el diálogo “Guardar como”)
  const handleDownloadPDF = async (id: number) => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/reservations/${id}/pdf`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reserva_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Error al descargar el PDF de la reserva.");
    }
  };

  // 🔹 Cambiar estado (aceptar o cancelar)
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/reservations/${id}`, { status });
      fetchReservations();
    } catch {
      alert("Error al actualizar estado de reserva.");
    }
  };

  // 🔹 Editar reserva existente
  const handleEdit = (id: number) => {
    navigate(`/reservations/edit/${id}`);
  };

  // 🔹 Mostrar garantes
  const handleOpenGuarantors = (guarantors: Guarantor[], id: number) => {
    setSelectedGuarantors(guarantors);
    setSelectedReservationId(id);
    setOpenGuarantors(true);
  };

  const handleCloseGuarantors = () => {
    setOpenGuarantors(false);
    setSelectedGuarantors([]);
    setSelectedReservationId(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#fff" }}>
        Listado de Reservas
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            background: "#2a2a3b",
            color: "white",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>DNI Cliente</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Patente</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Vehículo</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Garantes</TableCell>
                  <TableCell align="center" sx={{ color: "#00BFA5", fontWeight: 600 }}>
                    Documentación
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#00BFA5", fontWeight: 600 }}>
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {reservations.map((r) => (
                  <TableRow
                    key={r.id}
                    sx={{
                      "&:hover": { backgroundColor: "#33334d" },
                      transition: "0.3s",
                    }}
                  >
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.clientDni}</TableCell>
                    <TableCell>{r.plate}</TableCell>
                    <TableCell>{r.vehicle}</TableCell>
                    <TableCell>
                      {new Date(r.date).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          r.status === "Vigente"
                            ? "#00e676"
                            : r.status === "Vencida"
                            ? "#ff5252"
                            : "#ffb300",
                      }}
                    >
                      {r.status}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenGuarantors(r.guarantors || [], r.id)}
                      >
                        Ver ({r.guarantors?.length || 0})
                      </Button>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Descargar PDF">
                        <IconButton
                          color="primary"
                          onClick={() => handleDownloadPDF(r.id)}
                        >
                          <PictureAsPdfIcon sx={{ color: "#00BFA5" }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Aceptar Reserva">
                        <IconButton
                          onClick={() => handleUpdateStatus(r.id, "Aceptada")}
                        >
                          <CheckCircleIcon sx={{ color: "#4caf50" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar Reserva">
                        <IconButton
                          onClick={() => handleUpdateStatus(r.id, "Cancelada")}
                        >
                          <CancelIcon sx={{ color: "#e53935" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar Reserva">
                        <IconButton onClick={() => handleEdit(r.id)}>
                          <EditIcon sx={{ color: "#2196f3" }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {reservations.length === 0 && (
            <Typography
              variant="body1"
              align="center"
              sx={{ mt: 3, color: "#ccc" }}
            >
              No hay reservas registradas.
            </Typography>
          )}
        </Paper>
      )}

      <Box textAlign="center" mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/reservations")}
        >
          Nueva Reserva
        </Button>
      </Box>

      {/* 🔹 Modal de Garantes */}
      <Dialog
        open={openGuarantors}
        onClose={handleCloseGuarantors}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Garantes de la Reserva #{selectedReservationId}
        </DialogTitle>
        <DialogContent>
          {selectedGuarantors.length === 0 ? (
            <Typography>No hay garantes cargados.</Typography>
          ) : (
            selectedGuarantors.map((g, i) => (
              <Box
                key={i}
                sx={{
                  mb: 2,
                  p: 2,
                  background: "#2a2a3b",
                  borderRadius: 2,
                  color: "#fff",
                }}
              >
                <Typography sx={{ color: "#00BFA5", fontWeight: 600 }}>
                  {g.firstName} {g.lastName}
                </Typography>
                <Typography>DNI: {g.dni}</Typography>
                {g.address && <Typography>Domicilio: {g.address}</Typography>}
                {g.phone && <Typography>Teléfono: {g.phone}</Typography>}
                {g.dniFilePath && (
                  <Typography>
                    📎{" "}
                    <a
                      href={`http://localhost:3000${g.dniFilePath}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#00BFA5" }}
                    >
                      Ver DNI adjunto
                    </a>
                  </Typography>
                )}
                {g.payslipFilePath && (
                  <Typography>
                    📎{" "}
                    <a
                      href={`http://localhost:3000${g.payslipFilePath}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#00BFA5" }}
                    >
                      Ver Recibo de sueldo
                    </a>
                  </Typography>
                )}
              </Box>
            ))
          )}
        </DialogContent>
        <Box textAlign="center" p={2}>
          <Button variant="contained" onClick={handleCloseGuarantors}>
            Cerrar
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ReservationListPage;
