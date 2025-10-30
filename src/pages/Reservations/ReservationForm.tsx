import React, { useEffect, useMemo, useState } from "react";
import { Paper, Grid, TextField, Button, Typography, MenuItem, Box, Divider, IconButton } from "@mui/material";
import { createReservation, addGuarantor } from "../../api/reservations";
import axios from "axios";
import { formatMoney } from "../../utils/formatMoney";
import { Add } from "lucide-react";

type VehicleLite = { id: number; plate: string; brand: string; model: string; versionName: string; price: number; status: string; sold: boolean; };
type ClientLite = { id: number; firstName: string; lastName: string; dni: string };

type GuarantorRow = {
  firstName: string; lastName: string; dni: string; address: string; phone: string;
  dniCopy?: File | null; paystub?: File | null;
};

const DEFAULT_AMOUNT = 500000;

export const ReservationForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const [dni, setDni] = useState("");
  const [client, setClient] = useState<ClientLite | null>(null);

  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<VehicleLite | null>(null);

  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0,10));

  const [guarantors, setGuarantors] = useState<GuarantorRow[]>([
    { firstName: "", lastName: "", dni: "", address: "", phone: "", dniCopy: null, paystub: null },
  ]);

  // Buscar cliente por DNI (como en Presupuestos)
  useEffect(() => {
    const run = async () => {
      if (dni.length < 3) { setClient(null); return; }
      try {
        const res = await axios.get(`http://localhost:3000/api/clients/search/by-dni?dni=${dni}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setClient(res.data[0]);
        } else {
          setClient(null);
        }
      } catch {
        setClient(null);
      }
    };
    run();
  }, [dni]);

  // Buscar vehículo por patente (disponible)
  useEffect(() => {
    const run = async () => {
      if (!plate || plate.length < 3) { setVehicle(null); return; }
      try {
        const res = await axios.get("http://localhost:3000/api/vehicles", { params: { plate, status: "available", limit: 1 } });
        const items = res.data?.items || res.data || [];
        const v = items.find((x: any) => (x.plate || "").toLowerCase().includes(plate.toLowerCase()));
        setVehicle(v || null);
      } catch { setVehicle(null); }
    };
    run();
  }, [plate]);

  const expirationLabel = useMemo(() => {
    const d = new Date(dateStr);
    const exp = new Date(d.getTime() + 48 * 3600 * 1000);
    return exp.toLocaleString("es-AR");
  }, [dateStr]);

  const handleAddGuarantorRow = () => {
    setGuarantors((prev) => [...prev, { firstName: "", lastName: "", dni: "", address: "", phone: "", dniCopy: null, paystub: null }]);
  };

  const handleChangeGuarantor = (idx: number, key: keyof GuarantorRow, value: any) => {
    setGuarantors((prev) => prev.map((g, i) => (i === idx ? { ...g, [key]: value } : g)));
  };

  const handleCreate = async () => {
    if (!client) return alert("Cliente no encontrado. Verificá el DNI o cargalo en el módulo de Clientes.");
    if (!vehicle) return alert("La patente indicada no está disponible o no existe.");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const sellerId = user?.id ? Number(user.id) : undefined;

    const payload = {
      clientId: client.id,
      vehicleId: vehicle.id,
      sellerId,
      amount: amount, // se muestra como solo lectura, pero lo dejamos explícito
    };

    const created = await createReservation(payload);

    // Si se cargaron datos de garantes en el momento, subilos ahora:
    const hasAnyGuarantorData = guarantors.some(g => g.firstName || g.lastName || g.dni || g.address || g.phone || g.dniCopy || g.paystub);
    if (hasAnyGuarantorData) {
      for (const g of guarantors) {
        if (!(g.firstName && g.lastName && g.dni)) continue; // solo si tiene datos mínimos
        await addGuarantor(created.id, {
          firstName: g.firstName,
          lastName: g.lastName,
          dni: g.dni,
          address: g.address,
          phone: g.phone,
        }, { dniCopy: g.dniCopy || undefined, paystub: g.paystub || undefined });
      }
    }

    alert(`Reserva #${created.id} creada correctamente.`);
    onCreated?.();
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, background: "#1e1e2f" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Nueva Reserva</Typography>

      <Grid container spacing={2} columns={12}>
        <Grid item xs={12} md={6}>
          <TextField
            label="DNI Cliente"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Cliente"
            value={client ? `${client.firstName} ${client.lastName}` : ""}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Patente"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            label="Vehículo"
            value={vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.versionName}` : ""}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Fecha"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Reserva"
            value={formatMoney(amount)}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Estado"
            value="Vigente"
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />
        </Grid>
      </Grid>

      <Box mt={2} sx={{ color: "#ccc" }}>
        Vigencia de la reserva hasta: <b>{expirationLabel}</b>
      </Box>

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

      <Typography variant="h6" sx={{ mb: 1 }}>Garantes</Typography>
      {guarantors.map((g, idx) => (
        <Paper key={idx} sx={{ p: 2, mb: 2, background: "#24243a", borderRadius: 2 }}>
          <Grid container spacing={2} columns={12}>
            <Grid item xs={12} md={6}>
              <TextField label="Nombre" value={g.firstName} onChange={(e)=>handleChangeGuarantor(idx,'firstName',e.target.value)} fullWidth sx={{ input:{color:"#fff"}, label:{color:"#ccc"} }}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Apellido" value={g.lastName} onChange={(e)=>handleChangeGuarantor(idx,'lastName',e.target.value)} fullWidth sx={{ input:{color:"#fff"}, label:{color:"#ccc"} }}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="DNI" value={g.dni} onChange={(e)=>handleChangeGuarantor(idx,'dni',e.target.value)} fullWidth sx={{ input:{color:"#fff"}, label:{color:"#ccc"} }}/>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField label="Domicilio" value={g.address} onChange={(e)=>handleChangeGuarantor(idx,'address',e.target.value)} fullWidth sx={{ input:{color:"#fff"}, label:{color:"#ccc"} }}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Teléfono" value={g.phone} onChange={(e)=>handleChangeGuarantor(idx,'phone',e.target.value)} fullWidth sx={{ input:{color:"#fff"}, label:{color:"#ccc"} }}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button component="label" variant="outlined" fullWidth>
                Adjuntar Fotocopia DNI
                <input hidden type="file" onChange={(e)=>handleChangeGuarantor(idx,'dniCopy',e.target.files?.[0] || null)} />
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button component="label" variant="outlined" fullWidth>
                Adjuntar Último Recibo de Sueldo
                <input hidden type="file" onChange={(e)=>handleChangeGuarantor(idx,'paystub',e.target.files?.[0] || null)} />
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Box display="flex" justifyContent="flex-start" mb={2}>
        <Button startIcon={<Add />} variant="outlined" onClick={handleAddGuarantorRow}>
          Agregar garante
        </Button>
      </Box>

      <Box textAlign="right">
        <Button variant="contained" color="primary" onClick={handleCreate}>
          Guardar Reserva
        </Button>
      </Box>
    </Paper>
  );
};
