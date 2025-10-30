import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import axios from "axios";

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  versionName?: string;
  year: number;
  price: number;
  sold: boolean;
  status: string;
}

interface InstallmentSetting {
  id: number;
  installments: number;
  percentage: number;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
}

interface SaleFormProps {
  onSaleCreated: () => void;
  vehicles: Vehicle[];
}

const SaleForm: React.FC<SaleFormProps> = ({ onSaleCreated, vehicles }) => {
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [saleDate, setSaleDate] = useState<string>("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [paymentType, setPaymentType] = useState<string>("contado");
  const [installments, setInstallments] = useState<number | "">("");
  const [downPayment, setDownPayment] = useState<number | "">("");
  const [clientDni, setClientDni] = useState<string>("");
  const [clientName, setClientName] = useState<string>(""); // 💡 nuevo campo
  const [clientId, setClientId] = useState<number | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [calculatedInstallment, setCalculatedInstallment] = useState<number>(0);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentSetting[]>([]);

  // 🔹 Cargar planes de cuotas
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/installment-settings")
      .then((res) => setInstallmentPlans(res.data))
      .catch((err) => console.error("Error cargando cuotas:", err));
  }, []);

  // 🔍 Buscar cliente por DNI y autocompletar nombre
  const handleClientSearch = async (dni: string) => {
    if (dni.length >= 6) {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/clients/search/by-dni?dni=${dni}`
        );
        if (res.data && res.data.length > 0) {
          const client: Client = res.data[0];
          setClientId(client.id);
          setClientName(`${client.firstName} ${client.lastName}`); // ✅ autocompleta nombre
        } else {
          setClientId(null);
          setClientName("");
        }
      } catch {
        setClientId(null);
        setClientName("");
      }
    } else {
      setClientName("");
      setClientId(null);
    }
  };

  // ⚙️ Selección de vehículo
  useEffect(() => {
    if (vehicleId) {
      const vehicle = vehicles.find((v) => v.id === Number(vehicleId)) || null;
      if (vehicle) {
        setSalePrice(vehicle.price);
      }
    }
  }, [vehicleId, vehicles]);

  // 🧮 Previsualizar venta
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !saleDate || !salePrice || !clientDni) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    let cuota = 0;
    if (paymentType === "cuotas" && installments) {
      const plan = installmentPlans.find((p) => p.installments === Number(installments));
      const increase = plan ? 1 + plan.percentage / 100 : 1;
      const totalConRecargo = Number(salePrice) * increase;
      cuota = totalConRecargo / Number(installments);
    } else if (paymentType === "anticipo+cuotas" && installments && downPayment) {
      const plan = installmentPlans.find((p) => p.installments === Number(installments));
      const increase = plan ? 1 + plan.percentage / 100 : 1;
      const restante = Math.max(0, Number(salePrice) - Number(downPayment));
      const totalConRecargo = restante * increase;
      cuota = totalConRecargo / Number(installments);
    }

    setCalculatedInstallment(cuota);
    setOpenConfirm(true);
  };

  // 💾 Confirmar venta
  const handleConfirmSale = async () => {
    if (!clientId) {
      alert("Debe seleccionar un cliente válido antes de confirmar la venta.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const sellerId = user?.id || null;

    const payload = {
      vehicleId: Number(vehicleId),
      clientId,
      sellerId,
      saleDate,
      finalPrice: Number(salePrice),
      paymentType,
      saleType: paymentType,
      installments: installments ? Number(installments) : null,
      downPayment: downPayment ? Number(downPayment) : null,
      installmentValue: calculatedInstallment || null,
    };

    console.log("🚀 Enviando venta al backend:", payload);

    try {
      await axios.post("http://localhost:3000/api/sales", payload);
      alert("✅ Venta registrada correctamente.");
      onSaleCreated();

      setVehicleId("");
      setSaleDate("");
      setSalePrice("");
      setPaymentType("contado");
      setInstallments("");
      setDownPayment("");
      setClientDni("");
      setClientName("");
      setClientId(null);
      setOpenConfirm(false);
    } catch (error: any) {
      console.error("❌ Error al crear venta:", error);
      alert(`Error al registrar la venta: ${error.response?.data?.message || "Ver consola."}`);
    }
  };

  return (
    <Box width="100%">
      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: "#1e1e2f",
          color: "#fff",
          width: "100%",
        }}
      >
        <Typography variant="h5" align="center" gutterBottom sx={{ color: "#fff" }}>
          Registrar Nueva Venta
        </Typography>

        <Box
          component="form"
          onSubmit={handlePreview}
          display="grid"
          gridTemplateColumns="repeat(2, minmax(400px, 1fr))"
          gap={2}
          width="100%"
        >
          <TextField
            select
            label="Vehículo"
            value={vehicleId}
            onChange={(e) => setVehicleId(Number(e.target.value))}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            <MenuItem value="">Seleccione un vehículo</MenuItem>
            {vehicles.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.year}) - ${v.price.toLocaleString()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Fecha de venta"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="DNI del Cliente"
            value={clientDni}
            onChange={(e) => {
              setClientDni(e.target.value);
              handleClientSearch(e.target.value);
            }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="Nombre del Cliente"
            value={clientName}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="Precio de venta ($)"
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            select
            label="Tipo de Pago"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            <MenuItem value="contado">Contado</MenuItem>
            <MenuItem value="cuotas">Cuotas</MenuItem>
            <MenuItem value="anticipo+cuotas">Anticipo + Cuotas</MenuItem>
          </TextField>

          {paymentType.includes("cuotas") && (
            <TextField
              select
              label="Cantidad de Cuotas"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            >
              {installmentPlans.map((plan) => (
                <MenuItem key={plan.id} value={plan.installments}>
                  {plan.installments} cuotas (+{plan.percentage}%)
                </MenuItem>
              ))}
            </TextField>
          )}

          {paymentType === "anticipo+cuotas" && (
            <TextField
              label="Anticipo ($)"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          <Box gridColumn="span 2" textAlign="center" mt={2}>
            <Button type="submit" variant="contained" color="primary">
              Previsualizar Venta
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Modal */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirmar Venta</DialogTitle>
        <DialogContent>
          <Typography>💰 <b>Precio total:</b> ${salePrice}</Typography>
          {paymentType !== "contado" && (
            <>
              <Typography>📆 <b>Cuotas:</b> {installments}</Typography>
              <Typography>💸 <b>Valor de cada cuota:</b> ${calculatedInstallment.toFixed(2)}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={handleConfirmSale} variant="contained" color="success">
            Confirmar Venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { SaleForm };
