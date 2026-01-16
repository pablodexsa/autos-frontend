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

type AlertSeverity = "success" | "info" | "warning" | "error";
type AlertState = { open: boolean; message: string; severity: AlertSeverity };

const Budgets: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);

  const [form, setForm] = useState({
    // cliente
    dni: "",
    clientName: "",

    // vehículo
    vehicleId: "",
    price: "",

    // forma de pago / cuotas
    paymentType: "",
    installments: "",

    // permuta
    hasTradeIn: false,
    tradeInValue: "",
    tradeInPlate: "",

    // montos
    downPayment: "",
    montoPrendario: "",
    montoPersonal: "",
    montoFinanciacion: "",

    // calculados
    balance: "",
    finalPrice: "",
    installmentValue: "",
  });

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [errors, setErrors] = useState({
    tradeIn: "",
    prendario: "",
    financiacion: "",
  });

  const [loanRates, setLoanRates] = useState<Record<string, number>>({});
  const [maxPersonalFinancing, setMaxPersonalFinancing] =
    useState<number>(3500000);

  const formatPesos = (valor: any) => {
    if (valor === "" || valor === null || valor === undefined) return "-";
    const n = Number(valor) || 0;
    return `$ ${n.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 🚗 Vehículos disponibles
  useEffect(() => {
    api
      .get("/vehicles", { params: { status: "available" } })
      .then((res) => {
        const dataRaw = res.data;
        const data = Array.isArray(dataRaw)
          ? dataRaw
          : Array.isArray(dataRaw?.items)
          ? dataRaw.items
          : [];
        setVehicles(data);
      })
      .catch(() =>
        alert("No se pudieron cargar los vehículos disponibles.")
      );
  }, []);

  // Tasas de financiación
  useEffect(() => {
    api
      .get("/loan-rates")
      .then((res) => {
        const map: Record<string, number> = {};
        (res.data || []).forEach((r: any) => {
          const key = `${r.type}_${r.months}`; // ej: "prendario_12"
          map[key] = Number(r.rate);
        });
        setLoanRates(map);
      })
      .catch((err) => {
        console.error("Error cargando tasas de financiación:", err);
      });
  }, []);

  // Límite de financiación personal desde /settings (misma lógica que en Ventas)
  useEffect(() => {
    api
      .get("/settings/financing/personal-max")
      .then((res) => {
        const v = Number(res.data?.maxPersonalAmount);
        if (Number.isFinite(v) && v > 0) {
          setMaxPersonalFinancing(v);
        }
      })
      .catch((err) => {
        console.error(
          "Error cargando máximo de financiación personal:",
          err
        );
      });
  }, []);

  // Mapea 1..36 a 12 / 24 / 36
  const getRate = (
    type: "prendario" | "personal" | "financiacion",
    months: number
  ): number => {
    if (!months) return 0;
    const bracketMonths = months <= 12 ? 12 : months <= 24 ? 24 : 36;
    return loanRates[`${type}_${bracketMonths}`] ?? 0;
  };

  // Selección de vehículo
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    const vehicle = vehicles.find((v) => String(v.id) === String(id)) || null;
    setSelectedVehicle(vehicle);

    if (vehicle) {
      const priceStr = String(Number(vehicle.price || 0).toFixed(2));
      setForm((prev) => ({
        ...prev,
        vehicleId: id,
        price: priceStr,
        balance: priceStr,
        finalPrice: priceStr,
        downPayment: "",
        tradeInValue: "",
        tradeInPlate: "",
        montoPrendario: "",
        montoPersonal: "",
        montoFinanciacion: "",
        installments: "",
      }));
      setErrors({ tradeIn: "", prendario: "", financiacion: "" });
    } else {
      setForm((prev) => ({
        ...prev,
        vehicleId: "",
        price: "",
        balance: "",
        finalPrice: "",
        downPayment: "",
        tradeInValue: "",
        tradeInPlate: "",
        montoPrendario: "",
        montoPersonal: "",
        montoFinanciacion: "",
        installments: "",
      }));
      setErrors({ tradeIn: "", prendario: "", financiacion: "" });
    }
  };

  // 🔍 DNI → cliente
  const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dniValue = e.target.value;
    setForm((prev) => ({ ...prev, dni: dniValue }));

    if (dniValue.trim().length === 8) {
      try {
        const res = await api.get(
          `/clients/search/by-dni?dni=${dniValue.trim()}`
        );
        if (res.data?.length > 0) {
          const c = res.data[0];
          setForm((prev) => ({
            ...prev,
            clientName: `${c.firstName} ${c.lastName}`,
          }));
          setClientId(c.id);
        } else {
          setForm((prev) => ({ ...prev, clientName: "" }));
          setClientId(null);
        }
      } catch (err) {
        console.error("Error buscando cliente:", err);
        setForm((prev) => ({ ...prev, clientName: "" }));
        setClientId(null);
      }
    } else {
      setForm((prev) => ({ ...prev, clientName: "" }));
      setClientId(null);
    }
  };

  // Resetear permuta al destildar (mismo concepto que en Ventas)
  useEffect(() => {
    if (!form.hasTradeIn) {
      setForm((prev) => ({
        ...prev,
        tradeInValue: "",
        tradeInPlate: "",
        balance: selectedVehicle
          ? String(Number(selectedVehicle.price || 0).toFixed(2))
          : "",
      }));
    }
  }, [form.hasTradeIn, selectedVehicle]);

  // Reglas de negocio / validaciones (sin autocompletar montos)
  useEffect(() => {
    if (!selectedVehicle) return;

    const price = Number(selectedVehicle.price) || 0;
    const tradeIn = form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0;
    const montoPrendarioNum = Number(form.montoPrendario) || 0;
    const montoFinanciacionNum = Number(form.montoFinanciacion) || 0;

    // saldo = precio - permuta
    const newBalance = Math.max(price - tradeIn, 0);
    const newBalanceStr = newBalance.toFixed(2);
    if (form.balance !== newBalanceStr) {
      setForm((prev) => ({ ...prev, balance: newBalanceStr }));
    }

    const newErrors = { tradeIn: "", prendario: "", financiacion: "" };

    // Validaciones
    if (form.hasTradeIn && tradeIn > price) {
      newErrors.tradeIn =
        "El valor de la permuta no puede superar el precio del vehículo.";
    }
    if (montoPrendarioNum > price * 0.5) {
      newErrors.prendario =
        "El préstamo prendario no puede superar el 50% del valor del vehículo.";
    }
    if (montoFinanciacionNum > maxPersonalFinancing) {
      newErrors.financiacion = `El monto máximo de financiación personal es $${maxPersonalFinancing.toLocaleString(
        "es-AR"
      )}.`;
    }

    if (
      newErrors.tradeIn !== errors.tradeIn ||
      newErrors.prendario !== errors.prendario ||
      newErrors.financiacion !== errors.financiacion
    ) {
      setErrors(newErrors);
      if (
        newErrors.tradeIn ||
        newErrors.prendario ||
        newErrors.financiacion
      ) {
        const msg =
          newErrors.tradeIn || newErrors.prendario || newErrors.financiacion;
        setAlert({ open: true, message: msg, severity: "warning" });
      }
    }

    // Si la forma de pago es CONTADO, limpiamos préstamos, anticipo y cuotas
    if (form.paymentType === "contado") {
      if (
        form.downPayment ||
        form.montoPrendario ||
        form.montoPersonal ||
        form.montoFinanciacion ||
        form.installments
      ) {
        setForm((prev) => ({
          ...prev,
          downPayment: "",
          montoPrendario: "",
          montoPersonal: "",
          montoFinanciacion: "",
          installments: "",
        }));
      }
      return;
    }
  }, [
    selectedVehicle,
    form.hasTradeIn,
    form.tradeInValue,
    form.downPayment,
    form.montoPrendario,
    form.montoPersonal,
    form.montoFinanciacion,
    form.paymentType,
    maxPersonalFinancing,
    errors.tradeIn,
    errors.prendario,
    errors.financiacion,
  ]);

  // Totales base (sin tasas)
  useEffect(() => {
    if (!selectedVehicle) return;

    const price = Number(selectedVehicle.price) || 0;
    const tradeIn = form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0;
    const balance = Math.max(price - tradeIn, 0);
    const anticipo = Math.max(0, Number(form.downPayment) || 0);
    const nCuotas = Number(form.installments) || 0;

    const prendario = Number(form.montoPrendario) || 0;
    const personal = Number(form.montoPersonal) || 0;
    const financiacion = Number(form.montoFinanciacion) || 0;

    const restante = Math.max(
      balance - anticipo - prendario - personal - financiacion,
      0
    );
    const finalPrice =
      anticipo + prendario + personal + financiacion + restante;

    let installmentValue = 0;
    if (nCuotas > 0 && prendario + personal + financiacion > 0) {
      installmentValue = (prendario + personal + financiacion) / nCuotas;
    }

    const next = {
      finalPrice: finalPrice.toFixed(2),
      installmentValue: installmentValue ? installmentValue.toFixed(2) : "",
      balance: balance.toFixed(2),
    };

    if (
      form.finalPrice !== next.finalPrice ||
      form.installmentValue !== next.installmentValue ||
      form.balance !== next.balance
    ) {
      setForm((prev) => ({
        ...prev,
        ...next,
      }));
    }
  }, [
    selectedVehicle,
    form.paymentType,
    form.installments,
    form.downPayment,
    form.montoPrendario,
    form.montoPersonal,
    form.montoFinanciacion,
    form.tradeInValue,
    form.hasTradeIn,
    form.finalPrice,
    form.installmentValue,
    form.balance,
  ]);

  const hasErrors = Object.values(errors).some((msg) => !!msg);

  const requiresInstallments = form.paymentType === "anticipo_financiacion";

  const missingInstallments = requiresInstallments && !form.installments;

  // ---- Regla de composición del precio (global) igual que en Ventas ----
  const vehiclePrice =
    selectedVehicle && selectedVehicle.price
      ? Number(selectedVehicle.price) || 0
      : 0;

  const totalComposition =
    (Number(form.downPayment) || 0) +
    (form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0) +
    (Number(form.montoPrendario) || 0) +
    (Number(form.montoPersonal) || 0) +
    (Number(form.montoFinanciacion) || 0);

  const someAmountEntered =
    (Number(form.downPayment) || 0) ||
    (form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0) ||
    (Number(form.montoPrendario) || 0) ||
    (Number(form.montoPersonal) || 0) ||
    (Number(form.montoFinanciacion) || 0);

  const compositionDiff =
    selectedVehicle && someAmountEntered
      ? Math.abs(totalComposition - vehiclePrice)
      : 0;

  const compositionMismatch =
    form.paymentType === "anticipo_financiacion" &&
    !!selectedVehicle &&
    !!someAmountEntered &&
    compositionDiff > 1;

  // Preview con tasas
  const nCuotas = Number(form.installments) || 0;
  const netoPrendario = Number(form.montoPrendario) || 0;
  const netoPersonal = Number(form.montoPersonal) || 0;
  const netoFinanciacion = Number(form.montoFinanciacion) || 0;

  const tasaPrendario = getRate("prendario", nCuotas);
  const tasaPersonal = getRate("personal", nCuotas);
  const tasaFinanciacion = getRate("financiacion", nCuotas);

  const prendarioConInteres =
    netoPrendario > 0 ? netoPrendario * (1 + tasaPrendario / 100) : 0;
  const personalConInteres =
    netoPersonal > 0 ? netoPersonal * (1 + tasaPersonal / 100) : 0;
  const financiacionConInteres =
    netoFinanciacion > 0 ? netoFinanciacion * (1 + tasaFinanciacion / 100) : 0;

  const totalPrestamosConInteres =
    prendarioConInteres + personalConInteres + financiacionConInteres;

  const valorCuotaTotalConInteres =
    nCuotas > 0 && totalPrestamosConInteres > 0
      ? totalPrestamosConInteres / nCuotas
      : 0;

  const labelPayment = (p: string) => {
    switch (p) {
      case "contado":
        return "Contado";
      case "anticipo_financiacion":
        return "Anticipo + Financiación";
      default:
        return "-";
    }
  };

  const handlePaymentTypeChange = (
    value: "" | "contado" | "anticipo_financiacion"
  ) => {
    setErrors({ tradeIn: "", prendario: "", financiacion: "" });
    setForm((prev) => ({
      ...prev,
      paymentType: value,
      ...(value === "contado"
        ? {
            downPayment: "",
            montoPrendario: "",
            montoPersonal: "",
            montoFinanciacion: "",
            installments: "",
          }
        : {}),
    }));
  };

  const handleSaveBudget = async () => {
    if (!clientId || !selectedVehicle) {
      alert(
        "Debe seleccionar un cliente y un vehículo antes de generar el presupuesto."
      );
      return;
    }

    if (
      form.paymentType === "anticipo_financiacion" &&
      !form.installments
    ) {
      setAlert({
        open: true,
        message: "Debe seleccionar la cantidad de cuotas.",
        severity: "warning",
      });
      return;
    }

    // Validación de composición global solo para Anticipo + Financiación
    if (form.paymentType === "anticipo_financiacion") {
      const vehiclePriceLocal = Number(selectedVehicle.price) || 0;
      const totalCompositionLocal =
        (Number(form.downPayment) || 0) +
        (form.hasTradeIn ? Number(form.tradeInValue) || 0 : 0) +
        (Number(form.montoPrendario) || 0) +
        (Number(form.montoPersonal) || 0) +
        (Number(form.montoFinanciacion) || 0);

      const diffLocal = Math.abs(totalCompositionLocal - vehiclePriceLocal);

      if (diffLocal > 1) {
        setAlert({
          open: true,
          message: `La suma de anticipo, permuta y financiaciones ($${totalCompositionLocal.toLocaleString(
            "es-AR"
          )}) debe coincidir con el precio del vehículo ($${vehiclePriceLocal.toLocaleString(
            "es-AR"
          )}). Revise los importes.`,
          severity: "warning",
        });
        return;
      }
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
      hasTradeIn: !!form.hasTradeIn,
      tradeInValue: Number(form.tradeInValue) || 0,
      tradeInPlate: form.tradeInPlate.trim() || null,
      montoPrendario: Number(form.montoPrendario) || 0,
      montoPersonal: Number(form.montoPersonal) || 0,
      montoFinanciacion: Number(form.montoFinanciacion) || 0,
    };

    try {
      const res = await api.post("/budgets", payload, {
        headers: { "Content-Type": "application/json" },
      });
      const newBudget = res.data;

      const pdfUrl = `${import.meta.env.VITE_API_URL}/budgets/${newBudget.id}/pdf`;
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `Presupuesto-${(form.clientName || "cliente")
        .replace(/\s+/g, "_")
        .replace(/[^\w\-]/g, "")}-${newBudget.id}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);

      setAlert({
        open: true,
        message: "Presupuesto generado y descargado correctamente.",
        severity: "success",
      });
      setPreviewOpen(false);
    } catch (err: any) {
      console.error("❌ Error guardando presupuesto:", err);
      alert(
        `Error guardando presupuesto: ${err?.response?.status} - ${
          err?.response?.data?.message || "sin mensaje"
        }`
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Generar Presupuesto
      </Typography>

      <Paper
        sx={{
          p: 3,
          backgroundColor: "#1e1e2f",
          borderRadius: 2,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {/* FORMULARIO (dos columnas) - MISMO ORDEN QUE VENTAS */}
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
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
              <MenuItem key={v.id} value={String(v.id)}>
                {v.brand} {v.model} {v.versionName || ""} (
                {v.plate || "sin patente"})
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

          {/* Permuta */}
          <FormControlLabel
            control={
              <Checkbox
                checked={form.hasTradeIn}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    hasTradeIn: e.target.checked,
                  }))
                }
                sx={{ color: "#ccc" }}
              />
            }
            label="¿Tiene Permuta?"
          />

          {/* hueco para mantener grilla alineada */}
          <Box />

          {form.hasTradeIn && (
            <>
              <TextField
                label="Valor de la Permuta"
                type="number"
                value={form.tradeInValue}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tradeInValue: e.target.value,
                  }))
                }
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
            onChange={(e) =>
              handlePaymentTypeChange(
                e.target.value as "" | "contado" | "anticipo_financiacion"
              )
            }
            fullWidth
            sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
          >
            <MenuItem value="contado">Contado</MenuItem>
            <MenuItem value="anticipo_financiacion">
              Anticipo + Financiación
            </MenuItem>
          </TextField>

          {/* Cuotas (solo Anticipo + Financiación) */}
          {requiresInstallments && (
            <TextField
              select
              required
              label="Cantidad de Cuotas"
              value={form.installments}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  installments: e.target.value,
                }))
              }
              error={missingInstallments}
              helperText={
                missingInstallments
                  ? "Debe seleccionar la cantidad de cuotas."
                  : " "
              }
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            >
              {Array.from({ length: 36 }, (_, i) => i + 1).map((q) => (
                <MenuItem key={q} value={q}>
                  {q} cuotas
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Anticipo */}
          {form.paymentType === "anticipo_financiacion" && (
            <TextField
              label="Anticipo"
              type="number"
              value={form.downPayment}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  downPayment: e.target.value,
                }))
              }
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {/* hueco para alinear grilla */}
          {form.paymentType === "anticipo_financiacion" && <Box />}

          {/* Préstamo Prendario */}
          {form.paymentType === "anticipo_financiacion" && (
            <TextField
              label="Monto Préstamo Prendario (neto)"
              type="number"
              value={form.montoPrendario}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  montoPrendario: e.target.value,
                }))
              }
              fullWidth
              error={!!errors.prendario}
              helperText={errors.prendario}
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {/* Préstamo Personal */}
          {form.paymentType === "anticipo_financiacion" && (
            <TextField
              label="Monto Préstamo Personal (neto)"
              type="number"
              value={form.montoPersonal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  montoPersonal: e.target.value,
                }))
              }
              fullWidth
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}

          {/* Financiación Personal */}
          {form.paymentType === "anticipo_financiacion" && (
            <TextField
              label="Monto Financiación Personal (neto)"
              type="number"
              value={form.montoFinanciacion}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  montoFinanciacion: e.target.value,
                }))
              }
              fullWidth
              error={!!errors.financiacion}
              helperText={errors.financiacion}
              sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
            />
          )}
        </Box>

        {compositionMismatch && (
          <Box mt={2}>
            <Typography color="warning.main" variant="body2">
              La suma de anticipo, permuta y financiaciones (
              {formatPesos(totalComposition)}) no coincide con el precio del
              vehículo ({formatPesos(vehiclePrice)}). Ajuste los importes para
              continuar.
            </Typography>
          </Box>
        )}

        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
            onClick={() => setPreviewOpen(true)}
            disabled={
              !form.vehicleId ||
              !clientId ||
              hasErrors ||
              missingInstallments ||
              compositionMismatch
            }
          >
            Previsualizar
          </Button>
        </Box>
      </Paper>

      {/* Diálogo de previsualización */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Previsualización del Presupuesto</DialogTitle>
        <DialogContent>
          <Typography>Cliente: {form.clientName || "-"}</Typography>
          <Typography>DNI: {form.dni || "-"}</Typography>
          <Typography>
            Vehículo:{" "}
            {selectedVehicle
              ? `${selectedVehicle.brand} ${selectedVehicle.model} ${
                  selectedVehicle.versionName || ""
                }`
              : "-"}
          </Typography>
          <Typography>
            Forma de pago: {labelPayment(form.paymentType)}
          </Typography>
          {form.paymentType === "anticipo_financiacion" &&
            form.installments && (
              <Typography>Cuotas: {form.installments}</Typography>
            )}
          {form.paymentType === "anticipo_financiacion" &&
            form.downPayment && (
              <Typography>Anticipo: {formatPesos(form.downPayment)}</Typography>
            )}
          {form.hasTradeIn && form.tradeInValue && (
            <Typography>Permuta: {formatPesos(form.tradeInValue)}</Typography>
          )}

          {/* Valor de cuota total con financiación */}
          {form.paymentType === "anticipo_financiacion" &&
            valorCuotaTotalConInteres > 0 && (
              <Typography>
                Valor de Cuota total (con financiación):{" "}
                {formatPesos(valorCuotaTotalConInteres)}
              </Typography>
            )}

          {/* Detalle de préstamos */}
          {form.paymentType === "anticipo_financiacion" &&
            (netoPrendario || netoPersonal || netoFinanciacion) && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#009879", mb: 1 }}
                >
                  Detalle de Préstamos y Financiaciones
                </Typography>

                {netoPrendario > 0 && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#009879" }}
                    >
                      Préstamo Prendario
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Monto (neto): {formatPesos(netoPrendario)}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Tasa aplicada: {tasaPrendario}%
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Cuotas: {form.installments || "-"}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Valor de cada cuota (con financiación):{" "}
                      {nCuotas > 0
                        ? formatPesos(prendarioConInteres / nCuotas)
                        : "-"}
                    </Typography>
                  </Paper>
                )}

                {netoPersonal > 0 && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#009879" }}
                    >
                      Préstamo Personal
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Monto (neto): {formatPesos(netoPersonal)}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Tasa aplicada: {tasaPersonal}%
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Cuotas: {form.installments || "-"}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Valor de cada cuota (con financiación):{" "}
                      {nCuotas > 0
                        ? formatPesos(personalConInteres / nCuotas)
                        : "-"}
                    </Typography>
                  </Paper>
                )}

                {netoFinanciacion > 0 && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: "#f9f9f9" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#009879" }}
                    >
                      Financiación Personal
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Monto (neto): {formatPesos(netoFinanciacion)}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Tasa aplicada: {tasaFinanciacion}%
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Cuotas: {form.installments || "-"}
                    </Typography>
                    <Typography sx={{ color: "#000" }}>
                      Valor de cada cuota (con financiación):{" "}
                      {nCuotas > 0
                        ? formatPesos(financiacionConInteres / nCuotas)
                        : "-"}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

          <Box textAlign="center" mt={3}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
              onClick={handleSaveBudget}
              disabled={
                !clientId ||
                !selectedVehicle ||
                hasErrors ||
                missingInstallments ||
                compositionMismatch
              }
            >
              Generar y Descargar PDF
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setPreviewOpen(false)}
            >
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
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Budgets;
