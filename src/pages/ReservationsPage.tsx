import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { API_URL } from "../config";

interface Guarantor {
  firstName: string;
  lastName: string;
  dni: string;
  address?: string;
  phone?: string;
  dniFile?: File | null;
  payslipFile?: File | null;
  dniFilePath?: string | null;
  payslipFilePath?: string | null;
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  versionName: string;
  plate: string;
  price: number;
  status: string;
}

const emptyGuarantor: Guarantor = {
  firstName: "",
  lastName: "",
  dni: "",
  address: "",
  phone: "",
  dniFile: null,
  payslipFile: null,
  dniFilePath: null,
  payslipFilePath: null,
};

const ReservationsPage: React.FC = () => {
  const [dni, setDni] = useState("");
  const [client, setClient] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [reservationNumber, setReservationNumber] = useState<number | null>(null);
  const [pageError, setPageError] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const getAttachmentUrl = (filePath?: string | null) => {
    if (!filePath) return "";

    const trimmed = filePath.trim();

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (/^(blob:|data:)/i.test(trimmed)) {
      return trimmed;
    }

    const baseUrl = API_URL.replace(/\/api\/?$/, "");
    return trimmed.startsWith("/") ? `${baseUrl}${trimmed}` : `${baseUrl}/${trimmed}`;
  };

  const normalizeVehicle = (raw: any): Vehicle | null => {
    if (!raw) return null;

    return {
      id: Number(raw.id),
      brand: raw.brand || "",
      model: raw.model || "",
      versionName: raw.versionName || raw.version?.name || "",
      plate: raw.plate || "",
      price: Number(raw.price) || 0,
      status: raw.status || "",
    };
  };

  const fetchVehicles = async () => {
    try {

const endpoint = id
  ? "/vehicles?limit=1000"
  : "/vehicles?status=available&limit=1000";

      const res = await api.get(endpoint);
      const data = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];

      const normalizedVehicles: Vehicle[] = data.map((v: any) => ({
        id: Number(v.id),
        brand: v.brand || "",
        model: v.model || "",
        versionName: v.versionName || v.version?.name || "",
        plate: v.plate || "",
        price: Number(v.price) || 0,
        status: v.status || "",
      }));

      setVehicles(normalizedVehicles);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      setPageError("No se pudieron cargar los vehículos.");
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [id]);

  useEffect(() => {
    if (id) return;

    const fetchReservationAmount = async () => {
      try {
        const res = await api.get("/settings/reservations/amount");
        const v = Number(res.data?.reservationAmount);
        if (Number.isFinite(v) && v > 0) {
          setAmount(v);
        } else {
          setAmount(600000);
        }
      } catch (err) {
        console.error("Error cargando importe de reserva desde settings:", err);
        setAmount(600000);
      }
    };

    fetchReservationAmount();
  }, [id]);

  const handleFetchClient = async (dniValue: string) => {
    if (!dniValue || dniValue.length < 8) return;

    try {
      const res = await api.get("/clients/search/by-dni", {
        params: { dni: dniValue },
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        setClient(res.data[0]);
      } else {
        navigate(`/clients?dni=${dniValue}`);
      }
    } catch {
      navigate(`/clients?dni=${dniValue}`);
    }
  };

  useEffect(() => {
    const loadReservation = async () => {
      if (!id) return;

      try {
        setPageLoading(true);
        setPageError("");

        const res = await api.get(`/reservations/${id}`);
        const r = res.data;

        setReservationNumber(Number(r.id) || Number(id));
        setDni(r.client?.dni || "");
        setClient(r.client || null);
        setVehicle(normalizeVehicle(r.vehicle));
        setAmount(Number(r.amount) || 500000);

        if (Array.isArray(r.guarantors) && r.guarantors.length > 0) {
          const mapped: Guarantor[] = r.guarantors.map((g: any) => ({
            firstName: g?.firstName || "",
            lastName: g?.lastName || "",
            dni: g?.dni || "",
            address: g?.address || "",
            phone: g?.phone || "",
            dniFile: null,
            payslipFile: null,
            dniFilePath: g?.dniFilePath || null,
            payslipFilePath: g?.payslipFilePath || null,
          }));
          setGuarantors(mapped);
        } else {
          setGuarantors([]);
        }
      } catch (err) {
        console.error("Error cargando reserva:", err);
        setPageError("No se pudo cargar la reserva para edición.");
      } finally {
        setPageLoading(false);
      }
    };

    loadReservation();
  }, [id]);

  const handleAddGuarantor = () => {
    setGuarantors((prev) => [...prev, { ...emptyGuarantor }]);
  };

  const handleRemoveGuarantor = (index: number) => {
    setGuarantors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuarantorChange = (
    index: number,
    field: keyof Guarantor,
    value: any
  ) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const downloadRealPDF = async (reservationId: string | number) => {
    try {
      const res = await api.get(`/reservations/${reservationId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const disposition = res.headers["content-disposition"];
      let fileName = `Reserva-${reservationId}.pdf`;

      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("❌ Error descargando PDF:", error);
    }
  };

  const handleSubmit = async () => {
    if (!client || !vehicle) {
      alert("⚠️ Debes completar cliente y vehículo primero.");
      return;
    }

    try {
      setLoading(true);
      let reservationId = id;

      if (id) {
        await api.patch(`/reservations/${id}`, {
          clientDni: client.dni,
          plate: vehicle.plate,
          amount,
        });

        for (const g of guarantors) {
          if (g.dniFile || g.payslipFile) {
            const formData = new FormData();
            formData.append("firstName", g.firstName);
            formData.append("lastName", g.lastName);
            formData.append("dni", g.dni);
            if (g.address) formData.append("address", g.address);
            if (g.phone) formData.append("phone", g.phone);
            if (g.dniFile) formData.append("dniFile", g.dniFile);
            if (g.payslipFile) formData.append("payslipFile", g.payslipFile);

            await api.post(`/reservations/${id}/guarantors`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
        }

        await downloadRealPDF(id);
      } else {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const sellerId = user?.id || null;

        const res = await api.post("/reservations", {
          clientDni: client.dni,
          plate: vehicle.plate,
          amount,
          sellerId,
        });

        reservationId = res.data.id;

        for (const g of guarantors) {
          const formData = new FormData();
          formData.append("firstName", g.firstName);
          formData.append("lastName", g.lastName);
          formData.append("dni", g.dni);
          if (g.address) formData.append("address", g.address);
          if (g.phone) formData.append("phone", g.phone);
          if (g.dniFile) formData.append("dniFile", g.dniFile);
          if (g.payslipFile) formData.append("payslipFile", g.payslipFile);

          await api.post(`/reservations/${reservationId}/guarantors`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        await downloadRealPDF(reservationId);
      }

      navigate("/reservation-list");
    } catch (err) {
      console.error("Error al guardar reserva:", err);
      alert("❌ Error al guardar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  const formatPesos = (num: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);

  if (pageLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#fff", fontWeight: 600 }}>
        {id ? `Editar Reserva #${reservationNumber ?? id}` : "Crear Reserva"}
      </Typography>

      {pageError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {pageError}
        </Alert>
      )}

      <Paper sx={{ p: 3, backgroundColor: "#1e1e2f", borderRadius: 2 }}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          <TextField
            label="DNI Cliente"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value);
              handleFetchClient(e.target.value);
            }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="Cliente"
            value={client ? `${client.firstName || ""} ${client.lastName || ""}`.trim() : ""}
            InputProps={{ readOnly: true }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ color: "#ccc" }}>Vehículo</InputLabel>
            <Select
              value={vehicle?.id ?? ""}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const selected = vehicles.find((v) => v.id === selectedId);
                if (selected) setVehicle(selected);
              }}
              sx={{ color: "#fff" }}
              label="Vehículo"
            >
              {vehicles.map((v) => (
                <MenuItem
                  key={v.id}
                  value={v.id}
                  disabled={v.status !== "available" && (!vehicle || v.id !== vehicle.id)}
                >
                  {`${v.brand} ${v.model} ${v.versionName} (${v.plate}) - ${v.status}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Precio de Lista"
            value={vehicle ? formatPesos(vehicle.price) : ""}
            InputProps={{ readOnly: true }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="Importe de Reserva"
            value={formatPesos(amount)}
            InputProps={{ readOnly: true }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2, color: "#00BFA5" }}>
          Garantes
        </Typography>

        {guarantors.map((g, i) => {
          const dniUrl = getAttachmentUrl(g.dniFilePath);
          const payslipUrl = getAttachmentUrl(g.payslipFilePath);

          return (
            <Paper
              key={i}
              sx={{ p: 2, mb: 3, background: "#2a2a3b", borderRadius: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={g.firstName}
                    onChange={(e) =>
                      handleGuarantorChange(i, "firstName", e.target.value)
                    }
                    sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    value={g.lastName}
                    onChange={(e) =>
                      handleGuarantorChange(i, "lastName", e.target.value)
                    }
                    sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="DNI"
                    value={g.dni}
                    onChange={(e) =>
                      handleGuarantorChange(i, "dni", e.target.value)
                    }
                    sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Domicilio"
                    value={g.address || ""}
                    onChange={(e) =>
                      handleGuarantorChange(i, "address", e.target.value)
                    }
                    sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={g.phone || ""}
                    onChange={(e) =>
                      handleGuarantorChange(i, "phone", e.target.value)
                    }
                    sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ mb: 1, color: "#fff" }}>
                    Fotocopia DNI:
                  </Typography>

                  {dniUrl && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      📎{" "}
                      <a
                        href={dniUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#00BFA5", textDecoration: "none" }}
                      >
                        Ver archivo existente
                      </a>
                    </Typography>
                  )}

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleGuarantorChange(
                        i,
                        "dniFile",
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ mb: 1, color: "#fff" }}>
                    Último recibo de sueldo:
                  </Typography>

                  {payslipUrl && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      📎{" "}
                      <a
                        href={payslipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#00BFA5", textDecoration: "none" }}
                      >
                        Ver archivo existente
                      </a>
                    </Typography>
                  )}

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleGuarantorChange(
                        i,
                        "payslipFile",
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                  />
                </Grid>
              </Grid>

              <Box sx={{ textAlign: "right", mt: 2 }}>
                <Tooltip title="Eliminar garante">
                  <IconButton color="error" onClick={() => handleRemoveGuarantor(i)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}

        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          color="secondary"
          onClick={handleAddGuarantor}
        >
          Agregar garante
        </Button>

        <Box textAlign="right" mt={4} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => navigate("/reservation-list")}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Guardando..." : id ? "Actualizar Reserva" : "Guardar Reserva"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReservationsPage;