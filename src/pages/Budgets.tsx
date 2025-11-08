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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import api from "../api/api";

const Budgets: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
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
    balance: "", // saldo = precio - permuta
    finalPrice: "",
    installmentValue: "",
    hasTradeIn: false,
    tradeInValue: "",
    montoPrendario: "",
    montoPersonal: "",
    montoFinanciacion: "",
  });

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [errors, setErrors] = useState({
    tradeIn: "",
    prendario: "",
    financiacion: "",
  });

  // Helper: formato ARS
  const formatPesos = (valor: any) => {
    if (valor === "" || valor === null || valor === undefined) return "-";
    const n = Number(valor) || 0;
    return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 🚗 Cargar vehículos disponibles
  useEffect(() => {
    api
      .get("/vehicles", { params: { status: "available" } })
      .then((res) => {
        const data = res.data.items || res.data;
        setVehicles(data);
      })
      .catch(() => alert("No se pudieron cargar los vehículos disponibles."));
  }, []);

  // 🔍 Buscar cliente por DNI
  const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dniValue = e.target.value;
    setForm((prev) => ({ ...prev, dni: dniValue }));

    if (dniValue.length >= 3) {
      try {
        const res = await api.get(`/clients/search/by-dni?dni=${dniValue}`);
        if (res.data?.length > 0) {
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

  // 🧾 Selección de vehículo
  const handleVehicleChange = (e: any) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId));
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setForm((prev) => ({
        ...prev,
        vehicleId,
        price: vehicle.price,
        balance: vehicle.price,
        finalPrice: vehicle.price,
        downPayment: "",
        tradeInValue: "",
        montoPrendario: "",
        montoPersonal: "",
        montoFinanciacion: "",
      }));
    }
  };

  // 🔁 Resetear permuta cuando se destilda
  useEffect(() => {
    if (!form.hasTradeIn) {
      setForm((prev) => ({
        ...prev,
        tradeInValue: "",
        balance: selectedVehicle ? String(selectedVehicle.price) : "",
      }));
    }
  }, [form.hasTradeIn, selectedVehicle]);

  // 🔹 Validaciones y cálculo automático
  useEffect(() => {
    if (!selectedVehicle) return;

    const price = Number(selectedVehicle.price) || 0;
    const tradeIn = form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0;
    const anticipo = Number(form.downPayment) || 0;
    const montoPrendario = Number(form.montoPrendario) || 0;
    const montoFinanciacion = Number(form.montoFinanciacion) || 0;

    // saldo = precio - permuta (si hay permuta)
    const balance = Math.max(price - tradeIn, 0);
    if (form.balance !== balance.toFixed(2)) {
      setForm((prev) => ({ ...prev, balance: balance.toFixed(2) }));
    }

    const newErrors: any = { tradeIn: "", prendario: "", financiacion: "" };

    // ⚠️ Validaciones
    if (form.hasTradeIn && tradeIn > price) {
      newErrors.tradeIn = "El valor de la permuta no puede superar el precio del vehículo.";
      setAlert({ open: true, message: newErrors.tradeIn, severity: "warning" });
    }

    if (montoPrendario > price * 0.5) {
      newErrors.prendario = "El préstamo prendario no puede superar el 50% del valor del vehículo.";
      setAlert({ open: true, message: newErrors.prendario, severity: "warning" });
    }

    if (montoFinanciacion > 3500000) {
      newErrors.financiacion = "El monto máximo de financiación personal es $3.500.000.";
      setAlert({ open: true, message: newErrors.financiacion, severity: "warning" });
    }

    setErrors(newErrors);

    // 💡 Sugerir forma de pago automática
    const aporteTotal = anticipo + (form.hasTradeIn ? tradeIn : 0);
    const porcentajeSobrePrecio = price > 0 ? (aporteTotal / price) * 100 : 0;

    if (porcentajeSobrePrecio >= 50 && form.paymentType !== "anticipo_prendario") {
      setForm((prev) => ({ ...prev, paymentType: "anticipo_prendario" }));
      setAlert({
        open: true,
        message:
          "El anticipo + permuta equivale al 50% o más del precio. Se sugiere 'Anticipo + Préstamo Prendario'.",
        severity: "info",
      });
    } else if (
      porcentajeSobrePrecio < 50 &&
      !["anticipo_prendario_personal", "anticipo_prendario_financiacion"].includes(form.paymentType)
    ) {
      setForm((prev) => ({ ...prev, paymentType: "anticipo_prendario_personal" }));
      setAlert({
        open: true,
        message:
          "El anticipo + permuta es menor al 50% del precio. Se sugiere 'Anticipo + Prendario + Personal'.",
        severity: "info",
      });
    }

    // 💰 Autocompletar montos según forma de pago
    const remanente = Math.max(balance - anticipo, 0);
    const maxPrendario = price * 0.5;

    if (form.paymentType === "anticipo_prendario") {
      const nuevoPrendario = Math.min(remanente, maxPrendario);
      setForm((prev) => ({
        ...prev,
        montoPrendario: nuevoPrendario.toFixed(2),
        montoPersonal: "",
        montoFinanciacion: "",
      }));
    }

    if (form.paymentType === "anticipo_prendario_personal") {
      const autPrendario = Math.min(remanente, maxPrendario);
      const restanteLuegoPrendario = Math.max(remanente - autPrendario, 0);
      setForm((prev) => ({
        ...prev,
        montoPrendario: autPrendario.toFixed(2),
        montoPersonal: restanteLuegoPrendario.toFixed(2),
        montoFinanciacion: "",
      }));
    }

    if (form.paymentType === "anticipo_prendario_financiacion") {
      if (Number(form.montoFinanciacion) > 3500000) {
        setAlert({
          open: true,
          message: "La financiación personal no puede superar $3.500.000.",
          severity: "warning",
        });
      }
    }
  }, [
    form.tradeInValue,
    form.hasTradeIn,
    form.downPayment,
    form.montoPrendario,
    form.montoFinanciacion,
    form.paymentType,
    selectedVehicle,
  ]);

  // 💳 Calcular presupuesto
  const calculateBudget = () => {
    if (!selectedVehicle || !form.paymentType) return;

    const price = Number(selectedVehicle.price) || 0;
    const tradeIn = form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0;
    const balance = Math.max(price - tradeIn, 0);
    const anticipo = Math.max(0, Number(form.downPayment) || 0);
    const nCuotas = Number(form.installments) || 0;
    const prendario = Number(form.montoPrendario) || 0;
    const personal = Number(form.montoPersonal) || 0;
    const financiacion = Number(form.montoFinanciacion) || 0;

    const restante = Math.max(balance - anticipo - prendario - personal - financiacion, 0);
    const finalPrice = anticipo + prendario + personal + financiacion + restante;
    let installmentValue = 0;

    if (nCuotas > 0 && (prendario + personal + financiacion) > 0) {
      installmentValue = (prendario + personal + financiacion) / nCuotas;
    }

    setForm((prev) => ({
      ...prev,
      finalPrice: finalPrice.toFixed(2),
      installmentValue: installmentValue ? installmentValue.toFixed(2) : "",
    }));
  };

  useEffect(() => {
    calculateBudget();
  }, [
    form.paymentType,
    form.installments,
    form.downPayment,
    form.montoPrendario,
    form.montoPersonal,
    form.montoFinanciacion,
    form.tradeInValue,
    selectedVehicle,
  ]);

  // 💾 Guardar presupuesto (sin cambios)
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
      sellerId,
      paymentType: form.paymentType || null,
      installments: form.installments ? Number(form.installments) : null,
      price: Number(selectedVehicle.price),
      finalPrice: Number(form.finalPrice),
      installmentValue: Number(form.installmentValue) || 0,
      downPayment: Number(form.downPayment) || 0,
      tradeInValue: Number(form.tradeInValue) || 0,
      prendarioAmount: Number(form.montoPrendario) || null,
      prendarioMonths: Number(form.installments) || null,
      personalAmount: Number(form.montoPersonal) || null,
      personalMonths: Number(form.installments) || null,
      financiacionAmount: Number(form.montoFinanciacion) || null,
      financiacionMonths: Number(form.installments) || null,
    };

    try {
      const res = await api.post("/budgets", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const newBudget = res.data;
      if (newBudget?.id) {
        const pdfUrl = `${import.meta.env.VITE_API_URL}/budgets/${newBudget.id}/pdf`;
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const fileName = `Presupuesto-${form.clientName}-${newBudget.id}.pdf`;
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.open(url, "_blank");
        window.URL.revokeObjectURL(url);

        setAlert({
          open: true,
          message: "Presupuesto guardado y PDF descargado correctamente.",
          severity: "success",
        });
      }

      setPreviewOpen(false);
    } catch (err) {
      console.error("❌ Error guardando presupuesto:", err);
      setAlert({
        open: true,
        message: "Error al guardar el presupuesto.",
        severity: "error",
      });
    }
  };

  const hasErrors = Object.values(errors).some((msg) => msg !== "");

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
          {/* Vehículo */}
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
                {v.brand} {v.model} {v.versionName || ""} ({v.plate || "sin patente"})
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

          {/* Cliente */}
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

          {/* Permuta */}
          <FormControlLabel
            control={
              <Checkbox
                checked={form.hasTradeIn}
                onChange={(e) => setForm((prev) => ({ ...prev, hasTradeIn: e.target.checked }))}
                sx={{ color: "#ccc" }}
              />
            }
            label="¿Tiene Permuta?"
          />

          {form.hasTradeIn && (
            <>
              <TextField
                label="Valor de la Permuta"
                type="number"
                value={form.tradeInValue}
                onChange={(e) => setForm((prev) => ({ ...prev, tradeInValue: e.target.value }))}
                fullWidth
                error={!!errors.tradeIn}
                helperText={errors.tradeIn}
                sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
              />

              <TextField
                label="Saldo (Vehículo - Permuta)"
                value={form.balance}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
              />
            </>
          )}

          {/* Forma de pago */}
          <TextField
            select
            label="Forma de Pago"
            value={form.paymentType}
            onChange={(e) => setForm((prev) => ({ ...prev, paymentType: e.target.value }))}
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            <MenuItem value="contado">Contado</MenuItem>
            <MenuItem value="anticipo_prendario">Anticipo + Préstamo Prendario</MenuItem>
            <MenuItem value="anticipo_prendario_personal">Anticipo + Prendario + Personal</MenuItem>
            <MenuItem value="anticipo_prendario_financiacion">
              Anticipo + Prendario + Personal + Financiación
            </MenuItem>
          </TextField>

          {/* Anticipo */}
          {form.paymentType !== "contado" && (
            <TextField
              label="Anticipo"
              type="number"
              value={form.downPayment}
              onChange={(e) => setForm((prev) => ({ ...prev, downPayment: e.target.value }))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {/* Préstamos */}
          {form.paymentType.includes("prendario") && (
            <TextField
              label="Monto Préstamo Prendario (neto)"
              type="number"
              value={form.montoPrendario}
              onChange={(e) => setForm((prev) => ({ ...prev, montoPrendario: e.target.value }))}
              fullWidth
              error={!!errors.prendario}
              helperText={errors.prendario}
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {form.paymentType.includes("personal") && (
            <TextField
              label="Monto Préstamo Personal (neto)"
              type="number"
              value={form.montoPersonal}
              onChange={(e) => setForm((prev) => ({ ...prev, montoPersonal: e.target.value }))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {form.paymentType.includes("financiacion") && (
            <TextField
              label="Monto Financiación Personal (neto)"
              type="number"
              value={form.montoFinanciacion}
              onChange={(e) => setForm((prev) => ({ ...prev, montoFinanciacion: e.target.value }))}
              fullWidth
              error={!!errors.financiacion}
              helperText={errors.financiacion}
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {/* Cuotas */}
          {form.paymentType !== "contado" && (
            <TextField
              select
              label="Cantidad de Cuotas"
              value={form.installments}
              onChange={(e) => setForm((prev) => ({ ...prev, installments: e.target.value }))}
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            >
              {[6, 12, 18, 24].map((q) => (
                <MenuItem key={q} value={q}>
                  {q} cuotas
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>

        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
            onClick={() => setPreviewOpen(true)}
            disabled={!form.vehicleId || hasErrors}
          >
            Previsualizar
          </Button>
        </Box>
      </Paper>

      {/* Dialog de previsualización */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Previsualización del Presupuesto</DialogTitle>
        <DialogContent>
          <Typography>Cliente: {form.clientName}</Typography>
          <Typography>
            Vehículo: {selectedVehicle?.brand} {selectedVehicle?.model} {selectedVehicle?.versionName || ""}
          </Typography>
          <Typography>Forma de pago: {form.paymentType || "-"}</Typography>
          {form.installments && <Typography>Cuotas: {form.installments}</Typography>}
          {form.downPayment && <Typography>Anticipo: {formatPesos(form.downPayment)}</Typography>}
          {form.hasTradeIn && form.tradeInValue && (
            <Typography>Permuta: {formatPesos(form.tradeInValue)}</Typography>
          )}
          {form.installmentValue && (
            <Typography>Valor de Cuota total (estimado): {formatPesos(form.installmentValue)}</Typography>
          )}

{(form.montoPrendario || form.montoPersonal || form.montoFinanciacion) && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" sx={{ color: "#009879", mb: 1 }}>
      Detalle de Préstamos y Financiaciones
    </Typography>

    {form.montoPrendario && Number(form.montoPrendario) > 0 && (
      <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
        <Typography variant="subtitle1" sx={{ color: "#009879" }}>
          Préstamo Prendario
        </Typography>
        <Typography sx={{ color: "#000" }}>
          Monto (neto): {formatPesos(form.montoPrendario)}
        </Typography>
        <Typography sx={{ color: "#000" }}>Cuotas: {form.installments || "-"}</Typography>
      </Paper>
    )}

    {form.montoPersonal && Number(form.montoPersonal) > 0 && (
      <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
        <Typography variant="subtitle1" sx={{ color: "#009879" }}>
          Préstamo Personal
        </Typography>
        <Typography sx={{ color: "#000" }}>
          Monto (neto): {formatPesos(form.montoPersonal)}
        </Typography>
        <Typography sx={{ color: "#000" }}>Cuotas: {form.installments || "-"}</Typography>
      </Paper>
    )}

    {form.montoFinanciacion && Number(form.montoFinanciacion) > 0 && (
      <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
        <Typography variant="subtitle1" sx={{ color: "#009879" }}>
          Financiación Personal
        </Typography>
        <Typography sx={{ color: "#000" }}>
          Monto (neto): {formatPesos(form.montoFinanciacion)}
        </Typography>
        <Typography sx={{ color: "#000" }}>Cuotas: {form.installments || "-"}</Typography>
      </Paper>
    )}
  </Box>
)}


          <Box textAlign="center" mt={3}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
              onClick={async () => {
                await handleSaveBudget();
                setPreviewOpen(false);
              }}
              disabled={hasErrors}
            >
              Guardar y Descargar PDF
            </Button>

            <Button variant="outlined" color="secondary" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4500}
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
