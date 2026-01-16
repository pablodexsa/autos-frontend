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
  Link,
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

const ReservationsPage: React.FC = () => {
  const [dni, setDni] = useState("");
  const [client, setClient] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  // 🔹 Importe de reserva: ahora viene de settings (no fijo)
  const [amount, setAmount] = useState<number>(0);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservationNumber, setReservationNumber] =
    useState<number | null>(null);

  const navigate = useNavigate();
  const { id } = useParams();

  // 🚗 Cargar vehículos
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const endpoint = id ? "/vehicles" : "/vehicles?status=available";
        const res = await api.get(endpoint);
        const data = res.data.items || res.data;
        setVehicles(data);
      } catch {
        alert("No se pudieron cargar los vehículos.");
      }
    };
    fetchVehicles();
  }, [id]);

  // 🔹 Cargar importe por defecto de reserva desde /settings (solo alta)
  useEffect(() => {
    if (id) return; // en edición uso el amount de la reserva

    const fetchReservationAmount = async () => {
      try {
        const res = await api.get("/settings/reservations/amount");
        const v = Number(res.data?.reservationAmount);
        if (Number.isFinite(v) && v > 0) {
          setAmount(v);
        } else {
          setAmount(600000); // fallback por si no hay configuración
        }
      } catch (err) {
        console.error("Error cargando importe de reserva desde settings:", err);
        setAmount(600000); // fallback
      }
    };

    fetchReservationAmount();
  }, [id]);

  // 👤 Buscar cliente automáticamente por DNI
  const handleFetchClient = async (dniValue: string) => {
    if (!dniValue || dniValue.length < 8) return;
    try {
      const res = await api.get("/clients/search/by-dni", {
        params: { dni: dniValue },
      });
      if (res.data && res.data.length > 0) {
        setClient(res.data[0]);
      } else {
        navigate(`/clients?dni=${dniValue}`);
      }
    } catch {
      navigate(`/clients?dni=${dniValue}`);
    }
  };

  // 🔹 Cargar reserva existente (modo edición)
  useEffect(() => {
    const loadReservation = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/reservations/${id}`);
        const r = res.data;

        setReservationNumber(r.id);
        setDni(r.client?.dni || "");
        setClient(r.client);
        setVehicle(r.vehicle);
        // en edición respeto el monto que viene de la reserva
        setAmount(Number(r.amount) || 500000);

        if (r.guarantors?.length > 0) {
          const mapped = r.guarantors.map((g: any) => ({
            firstName: g.firstName,
            lastName: g.lastName,
            dni: g.dni,
            address: g.address || "",
            phone: g.phone || "",
            dniFile: null,
            payslipFile: null,
            dniFilePath: g.dniFilePath || null,
            payslipFilePath: g.payslipFilePath || null,
          }));
          setGuarantors(mapped);
        }
      } catch (err) {
        console.error("Error cargando reserva:", err);
      }
    };
    loadReservation();
  }, [id]);

  // ➕ Agregar garante
  const handleAddGuarantor = () =>
    setGuarantors([
      ...guarantors,
      {
        firstName: "",
        lastName: "",
        dni: "",
        address: "",
        phone: "",
        dniFile: null,
        payslipFile: null,
        dniFilePath: null,
        payslipFilePath: null,
      },
    ]);

  // 🗑️ Eliminar garante
  const handleRemoveGuarantor = (index: number) =>
    setGuarantors(guarantors.filter((_, i) => i !== index));

  // ✏️ Actualizar garante
  const handleGuarantorChange = (
    index: number,
    field: keyof Guarantor,
    value: any
  ) => {
    const updated = [...guarantors];
    (updated[index] as any)[field] = value;
    setGuarantors(updated);
  };

  // 📄 Descargar PDF con nombre real desde el backend
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
        if (match && match[1]) fileName = decodeURIComponent(match[1]);
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error descargando PDF:", error);
    }
  };

  // 💾 Guardar o actualizar reserva
  const handleSubmit = async () => {
    if (!client || !vehicle)
      return alert("⚠️ Debes completar cliente y vehículo primero.");

    try {
      setLoading(true);
      let reservationId = id;

      if (id) {
        // 🔹 Edición: mantengo el seller original (no lo piso)
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
        // 🔹 Alta: sellerId = usuario logueado (como en Sales/Budgets)
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#fff", fontWeight: 600 }}>
        {id ? `Editar Reserva #${reservationNumber ?? id}` : "Crear Reserva"}
      </Typography>

      <Paper sx={{ p: 3, backgroundColor: "#1e1e2f", borderRadius: 2 }}>
        {/* --- CLIENTE Y VEHÍCULO --- */}
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
            value={client ? `${client.firstName} ${client.lastName}` : ""}
            InputProps={{ readOnly: true }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ color: "#ccc" }}>Vehículo</InputLabel>
            <Select
              value={vehicle ? vehicle.id : ""}
              onChange={(e) => {
                const selected = vehicles.find((v) => v.id === e.target.value);
                if (selected) setVehicle(selected);
              }}
              sx={{ color: "#fff" }}
            >
              {vehicles.map((v) => (
                <MenuItem
                  key={v.id}
                  value={v.id}
                  disabled={
                    v.status !== "available" && (!vehicle || v.id !== vehicle.id)
                  }
                >
                  {`${v.brand} ${v.model} ${v.versionName} (${v.plate}) - ${
                    v.status
                  }`}
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

        {/* --- GARANTES --- */}
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" sx={{ mb: 2, color: "#00BFA5" }}>
          Garantes
        </Typography>

        {guarantors.map((g, i) => (
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
                  value={g.address}
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
                  value={g.phone}
                  onChange={(e) =>
                    handleGuarantorChange(i, "phone", e.target.value)
                  }
                  sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
                />
              </Grid>

              {/* Archivos */}
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Fotocopia DNI:
                </Typography>
                {g.dniFilePath && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    📎{" "}
                    <Link
                      href={`${API_URL.replace("/api", "")}${g.dniFilePath}`}
                      target="_blank"
                      rel="noreferrer"
                      color="#00BFA5"
                    >
                      Ver archivo existente
                    </Link>
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
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Último recibo de sueldo:
                </Typography>
                {g.payslipFilePath && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    📎{" "}
                    <Link
                      href={`${API_URL.replace("/api", "")}${g.payslipFilePath}`}
                      target="_blank"
                      rel="noreferrer"
                      color="#00BFA5"
                    >
                      Ver archivo existente
                    </Link>
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
        ))}

        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          color="secondary"
          onClick={handleAddGuarantor}
        >
          Agregar garante
        </Button>

        <Box textAlign="right" mt={4}>
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
