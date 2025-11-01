import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../api/api"; // ✅ cliente global
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Budgets = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);

  const [form, setForm] = useState({
    vehicleId: "",
    dni: "",
    clientName: "",
    paymentType: "",
    installments: "",
    downPayment: "",
    price: "",
    finalPrice: "",
    installmentValue: "",
  });

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 🚗 Cargar vehículos disponibles
  useEffect(() => {
    api
      .get("/vehicles", { params: { status: "available" } })
      .then((res) => {
        const data = res.data.items || res.data;
        setVehicles(data);
      })
      .catch((err) => {
        console.error("Error cargando vehículos:", err);
        alert("No se pudieron cargar los vehículos disponibles.");
      });
  }, []);

  // 📊 Cargar cuotas desde installment_setting
  useEffect(() => {
    api
      .get("/installment-settings")
      .then((res) => setInstallments(res.data))
      .catch((err) => console.error("Error cargando cuotas:", err));
  }, []);

  // 🔹 Buscar cliente por DNI (autocompletado)
  const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dniValue = e.target.value;
    setForm((prev) => ({ ...prev, dni: dniValue }));

    if (dniValue.length >= 3) {
      try {
        const res = await api.get(`/clients/search/by-dni?dni=${dniValue}`);
        if (res.data && res.data.length > 0) {
          const cliente = res.data[0];
          setForm((prev) => ({
            ...prev,
            clientName: `${cliente.firstName} ${cliente.lastName}`,
          }));
          setClientId(cliente.id);
        } else {
          setForm((prev) => ({ ...prev, clientName: "" }));
          setClientId(null);
        }
      } catch (err) {
        console.error("Error buscando cliente:", err);
      }
    } else {
      setForm((prev) => ({ ...prev, clientName: "" }));
      setClientId(null);
    }
  };

  // 🧾 Selección de vehículo → cargar precio base
  const handleVehicleChange = (e: any) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setForm((prev) => ({
        ...prev,
        vehicleId,
        price: vehicle.price,
        finalPrice: vehicle.price,
        installmentValue: "",
      }));
    }
  };

  // 💳 Cálculo automático del presupuesto (idéntico al tuyo)
  const calculateBudget = () => {
    if (!selectedVehicle || !form.paymentType) return;

    const price = Number(selectedVehicle.price) || 0;
    const nCuotas = Number(form.installments) || 0;
    const anticipo = Math.max(0, Number(form.downPayment) || 0);

    const plan = installments.find((i) => Number(i.installments) === nCuotas);
    const increase = plan ? Number(plan.percentage) / 100 : 0;

    let finalPrice = price;
    let installmentValue = 0;

    if (form.paymentType === "contado") {
      finalPrice = price;
      installmentValue = 0;
    } else if (form.paymentType === "cuotas") {
      if (nCuotas > 0 && plan) {
        const totalConRecargo = price * (1 + increase);
        finalPrice = totalConRecargo;
        installmentValue = totalConRecargo / nCuotas;
      } else {
        finalPrice = price;
        installmentValue = 0;
      }
    } else if (form.paymentType === "anticipo_cuotas") {
      const restante = Math.max(0, price - anticipo);

      if (nCuotas > 0 && plan) {
        const financiadoConRecargo = restante * (1 + increase);
        installmentValue = financiadoConRecargo / nCuotas;
        finalPrice = anticipo + financiadoConRecargo;
      } else {
        finalPrice = anticipo + restante;
        installmentValue = 0;
      }
    }

    setForm((prev) => ({
      ...prev,
      finalPrice: finalPrice.toFixed(2),
      installmentValue: installmentValue ? installmentValue.toFixed(2) : "",
    }));
  };

  useEffect(() => {
    calculateBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.paymentType, form.installments, form.downPayment, selectedVehicle]);

  // 📄 Generar PDF formal
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("De Grazia Automotores", 20, 20);
    doc.setFontSize(10);
    doc.text(`Presupuesto Nº ${Math.floor(Math.random() * 9000 + 1000)}`, 20, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 30);
    doc.text(`Vendedor: Anónimo`, 20, 40);
    doc.text(`Cliente: ${form.clientName} (${form.dni})`, 20, 50);

    autoTable(doc, {
      startY: 60,
      head: [["Vehículo", "Forma de Pago", "Precio de lista", "Cuotas", "Valor Cuota", "Anticipo"]],
      body: [
        [
          `${selectedVehicle?.brand || ""} ${selectedVehicle?.model || ""} ${selectedVehicle?.versionName || ""} (${selectedVehicle?.plate || "sin patente"})`,
          form.paymentType,
          `$${form.price}`,
          form.installments || "-",
          form.installmentValue ? `$${form.installmentValue}` : "-",
          form.downPayment ? `$${form.downPayment}` : "-",
        ],
      ],
    });

    doc.text(
      "Este presupuesto es válido por 3 días hábiles a partir de la fecha de emisión.",
      20,
      (doc as any).lastAutoTable.finalY + 20
    );
    doc.text(
      "De Grazia Automotores - Dirección: Av. Siempre Viva 123 - Tel: (000) 123-4567",
      20,
      (doc as any).lastAutoTable.finalY + 28
    );

    doc.save(`Presupuesto-${form.dni}.pdf`);
  };

  // 💾 Guardar presupuesto
  const handleSaveBudget = async () => {
    if (!clientId || !selectedVehicle) {
      alert("Debe seleccionar un cliente y un vehículo antes de generar el presupuesto.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const sellerId = user?.id || null;

    const payload = {
      vehicleId: Number(selectedVehicle?.id) || null,
      clientId: Number(clientId) || null,
      sellerId: sellerId ? Number(sellerId) : null,
      paymentType: form.paymentType || null,
      installments: form.installments ? Number(form.installments) : null,
      listPrice: selectedVehicle?.price ? Number(selectedVehicle.price) : null,
      finalPrice: form.finalPrice ? Number(form.finalPrice) : null,
      installmentValue: form.installmentValue ? Number(form.installmentValue) : null,
      downPayment: form.downPayment ? Number(form.downPayment) : null,
    };

    console.log("🚀 Enviando payload final a backend:", payload);

    try {
      const res = await api.post("/budget-reports", payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Presupuesto guardado correctamente:", res.data);
      generatePDF();
      setPreviewOpen(false);
      setAlert({ open: true, message: "Presupuesto guardado correctamente.", severity: "success" });
    } catch (err) {
      console.error("❌ Error guardando presupuesto:", err);
      setAlert({ open: true, message: "Error al guardar el presupuesto.", severity: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Crear Presupuesto
      </Typography>

      <Paper
        sx={{
          p: 3,
          backgroundColor: "#1e1e2f",
          borderRadius: 2,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          <TextField
            select
            label="Vehículo"
            value={form.vehicleId}
            onChange={handleVehicleChange}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            {vehicles.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.brand} {v.model} {v.versionName ? v.versionName : ""} ({v.plate || "sin patente"})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Precio Base"
            value={form.price}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="DNI del Cliente"
            value={form.dni}
            onChange={handleDniChange}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            label="Nombre del Cliente"
            value={form.clientName}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          />

          <TextField
            select
            label="Forma de Pago"
            value={form.paymentType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paymentType: e.target.value }))
            }
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            <MenuItem value="contado">Contado</MenuItem>
            <MenuItem value="anticipo_cuotas">Anticipo + Cuotas</MenuItem>
            <MenuItem value="cuotas">Solo Cuotas</MenuItem>
          </TextField>

          {form.paymentType.includes("cuotas") && (
            <TextField
              select
              label="Cantidad de Cuotas"
              value={form.installments}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, installments: e.target.value }))
              }
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            >
              {installments.map((i) => (
                <MenuItem key={i.id} value={i.installments}>
                  {i.installments} cuotas (+{i.percentage}%)
                </MenuItem>
              ))}
            </TextField>
          )}

          {form.paymentType === "anticipo_cuotas" && (
            <TextField
              label="Anticipo"
              type="number"
              value={form.downPayment}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, downPayment: e.target.value }))
              }
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}
        </Box>

        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
            onClick={() => setPreviewOpen(true)}
            disabled={!form.vehicleId}
          >
            Previsualizar
          </Button>
        </Box>
      </Paper>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Previsualización del Presupuesto</DialogTitle>
        <DialogContent>
          <Typography>Cliente: {form.clientName}</Typography>
          <Typography>
            Vehículo: {selectedVehicle?.brand} {selectedVehicle?.model}
          </Typography>
          <Typography>Forma de pago: {form.paymentType}</Typography>
          {form.installments && <Typography>Cuotas: {form.installments}</Typography>}
          {form.downPayment && <Typography>Anticipo: ${form.downPayment}</Typography>}
          {form.installmentValue && <Typography>Valor de Cuota: ${form.installmentValue}</Typography>}

          <Box textAlign="center" mt={3}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
              onClick={async () => {
                await handleSaveBudget();
                setPreviewOpen(false);
              }}
            >
              Guardar y Descargar PDF
            </Button>

            <Button variant="outlined" color="secondary" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ✅ Snackbar de confirmación */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity as any}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Budgets;
