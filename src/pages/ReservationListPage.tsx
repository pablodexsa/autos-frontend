import React, { useEffect, useMemo, useState } from "react";
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
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

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
  sellerName?: string;
}

type AlertState = {
  open: boolean;
  msg: string;
  type: "success" | "error";
  showRefundsAction?: boolean;
};

type ConfirmAction = {
  open: boolean;
  reservationId: number | null;
  nextStatus: "Aceptada" | "Cancelada" | null;
};

const ReservationListPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const [openGuarantors, setOpenGuarantors] = useState(false);
  const [selectedGuarantors, setSelectedGuarantors] = useState<Guarantor[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  const [confirm, setConfirm] = useState<ConfirmAction>({
    open: false,
    reservationId: null,
    nextStatus: null,
  });

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    msg: "",
    type: "success",
    showRefundsAction: false,
  });

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission("RESERVATION_APPROVE");
  const canCancel = hasPermission("RESERVATION_CANCEL");
  const canEdit = hasPermission("RESERVATION_EDIT");

  const isVigente = (status: string) => status === "Vigente";

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get<Reservation[]>("/reservations");
      setReservations(res.data);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setAlert({
        open: true,
        msg: "Error al cargar reservas.",
        type: "error",
        showRefundsAction: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleDownloadPDF = async (id: number) => {
    try {
      const reservation = reservations.find((r) => r.id === id);
      const lastName = reservation?.clientName?.split(" ").pop() || "Cliente";
      const today = new Date();
      const dateString = today.toISOString().split("T")[0];
      const fileName = `Reserva-${lastName}-${dateString}-${id}.pdf`;

      const res = await api.get(`/reservations/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error al descargar el PDF de la reserva:", err);
      setAlert({
        open: true,
        msg: "Error al descargar el PDF de la reserva.",
        type: "error",
        showRefundsAction: false,
      });
    }
  };

  // ✅ Confirmación antes de ejecutar
  const askConfirm = (id: number, nextStatus: "Aceptada" | "Cancelada") => {
    setConfirm({ open: true, reservationId: id, nextStatus });
  };

  const closeConfirm = () => {
    setConfirm({ open: false, reservationId: null, nextStatus: null });
  };

  const handleUpdateStatus = async (id: number, status: "Aceptada" | "Cancelada") => {
    try {
      await api.patch(`/reservations/${id}`, { status });
      await fetchReservations();

      if (status === "Cancelada") {
        setAlert({
          open: true,
          msg: "Reserva cancelada. Se generó una devolución pendiente.",
          type: "success",
          showRefundsAction: true,
        });
      } else {
        setAlert({
          open: true,
          msg: "Reserva aceptada correctamente.",
          type: "success",
          showRefundsAction: false,
        });
      }
    } catch (e: any) {
      console.error("Error al actualizar estado:", e);
      setAlert({
        open: true,
        msg: e?.response?.data?.message || "Error al actualizar estado de reserva.",
        type: "error",
        showRefundsAction: false,
      });
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/reservations/edit/${id}`);
  };

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

  const handleForceExpire = async () => {
    try {
      setLoading(true);
      await api.post("/reservations/expire");
      setAlert({
        open: true,
        msg: "Reservas vencidas actualizadas correctamente.",
        type: "success",
        showRefundsAction: false,
      });
      await fetchReservations();
    } catch (error) {
      console.error("Error al actualizar vencidas:", error);
      setAlert({
        open: true,
        msg: "Error al actualizar vencidas.",
        type: "error",
        showRefundsAction: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmText = useMemo(() => {
    if (!confirm.nextStatus) return "";
    return confirm.nextStatus === "Aceptada"
      ? "¿Confirmás que querés ACEPTAR esta reserva?"
      : "¿Confirmás que querés CANCELAR esta reserva? Se generará una devolución pendiente.";
  }, [confirm.nextStatus]);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 600 }}>
          Listado de Reservas
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReservations}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleForceExpire}
            disabled={loading}
          >
            Actualizar vencidas
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2, backgroundColor: "#1e1e2f" }}>
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
                  <TableCell sx={{ color: "#00BFA5", fontWeight: 600 }}>Vendedor</TableCell>
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
                      color: "#fff",
                    }}
                  >
                    <TableCell sx={{ color: "#fff" }}>{r.id}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>{r.clientDni}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>{r.plate}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>{r.vehicle}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>
                      {r.date ? new Date(r.date).toLocaleDateString("es-AR") : "-"}
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

                    <TableCell sx={{ color: "#fff" }}>{r.sellerName || "Anónimo"}</TableCell>

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
                        <IconButton color="primary" onClick={() => handleDownloadPDF(r.id)}>
                          <PictureAsPdfIcon sx={{ color: "#00BFA5" }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* ✅ ACCIONES SOLO SI ESTÁ VIGENTE */}
                    <TableCell align="center">
                      {isVigente(r.status) ? (
                        <>
                          {canApprove && (
                            <Tooltip title="Aceptar Reserva">
                              <IconButton onClick={() => askConfirm(r.id, "Aceptada")}>
                                <CheckCircleIcon sx={{ color: "#4caf50" }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canCancel && (
                            <Tooltip title="Cancelar Reserva">
                              <IconButton onClick={() => askConfirm(r.id, "Cancelada")}>
                                <CancelIcon sx={{ color: "#e53935" }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canEdit && (
                            <Tooltip title="Editar Reserva">
                              <IconButton onClick={() => handleEdit(r.id)}>
                                <EditIcon sx={{ color: "#2196f3" }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {!canApprove && !canCancel && !canEdit && (
                            <Typography variant="caption" sx={{ color: "#888" }}>
                              Sin permisos
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          Sin acciones
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {reservations.length === 0 && (
            <Typography variant="body1" align="center" sx={{ mt: 3, color: "#ccc" }}>
              No hay reservas registradas.
            </Typography>
          )}
        </Paper>
      )}

      <Box textAlign="center" mt={4}>
        <Button variant="contained" color="primary" onClick={() => navigate("/reservations")}>
          Nueva Reserva
        </Button>
      </Box>

      {/* Modal de Garantes */}
      <Dialog open={openGuarantors} onClose={handleCloseGuarantors} maxWidth="sm" fullWidth>
        <DialogTitle>Garantes de la Reserva #{selectedReservationId}</DialogTitle>
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
                      href={`${API_URL.replace("/api", "")}${g.dniFilePath}`}
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
                      href={`${API_URL.replace("/api", "")}${g.payslipFilePath}`}
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

      {/* Confirmación Aceptar/Cancelar */}
      <Dialog open={confirm.open} onClose={closeConfirm}>
        <DialogTitle>Confirmar acción</DialogTitle>
        <DialogContent>
          <Typography>{confirmText}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} variant="outlined">
            No
          </Button>
          <Button
            onClick={async () => {
              if (confirm.reservationId && confirm.nextStatus) {
                const id = confirm.reservationId;
                const st = confirm.nextStatus;
                closeConfirm();
                await handleUpdateStatus(id, st);
              }
            }}
            variant="contained"
            color={confirm.nextStatus === "Cancelada" ? "error" : "success"}
          >
            Sí, confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false, showRefundsAction: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={alert.type}
          action={
            alert.showRefundsAction ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setAlert((prev) => ({ ...prev, open: false, showRefundsAction: false }));
                  navigate("/refunds");
                }}
              >
                Ir a Devoluciones
              </Button>
            ) : undefined
          }
        >
          {alert.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReservationListPage;
