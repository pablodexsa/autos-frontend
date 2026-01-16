import React, { useEffect, useMemo, useState } from "react";
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

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  versionName?: string;
  plate?: string;
  price: number;
};

type AlertSeverity = "success" | "info" | "warning" | "error";
type AlertState = { open: boolean; message: string; severity: AlertSeverity };

const Sales: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Tasas de financiación desde backend
  const [loanRates, setLoanRates] = useState<Record<string, number>>({});

  // Límite configurable de financiación personal (se trae desde /settings)
  const [maxPersonalFinancing, setMaxPersonalFinancing] =
    useState<number>(3500000);

  // Próximos 2 meses sugeridos para inicio de pagos
  const nextTwoMonths = useMemo(() => {
    const now = new Date();
    const m1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const m2 = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return [fmt(m1), fmt(m2)];
  }, []);

  const [form, setForm] = useState({
    // cliente
    dni: "",
    clientName: "",

    // vehículo
    vehicleId: "",
    price: "",

    // forma de pago y montos
    // "contado" | "anticipo_financiacion"
    paymentType: "",
    installments: "",

    hasTradeIn: false,
    tradeInValue: "",
    tradeInPlate: "",
    downPayment: "",

    montoPrendario: "",
    montoPersonal: "",
    montoFinanciacion: "",

    // calculados
    balance: "",
    finalPrice: "",
    installmentValue: "",

    // datos de cobro
    paymentDay: 5,
    initialPaymentMonth: "",
  });

  // Helper: formato ARS
  const formatPesos = (valor: any) => {
    if (valor === "" || valor === null || valor === undefined) return "-";
    const n = Number(valor) || 0;
    return `$ ${n.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Cargar tasas desde /loan-rates
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

  // Cargar límite de financiación personal desde /settings
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

  // Mapea la cantidad real de cuotas al tramo de tasa (12, 24 o 36)
  const mapMonthsToBracket = (months: number): number => {
    if (!months || months <= 0) return 0;
    if (months <= 12) return 12;
    if (months <= 24) return 24;
    return 36; // 25 a 36
  };

  const getRate = (
    type: "prendario" | "personal" | "financiacion",
    months: number
  ): number => {
    const bracket = mapMonthsToBracket(months);
    if (!bracket) return 0;
    return loanRates[`${type}_${bracket}`] ?? 0;
  };

  // Cargar vehículos (disponibles + si el DNI tiene reserva aceptada)
  const loadVehicles = async (dni?: string) => {
    try {
      const res = await api.get(
        `/sales/eligible-vehicles${dni ? `?dni=${encodeURIComponent(dni)}` : ""}`
      );
      const data: Vehicle[] = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? [];
      setVehicles(data ?? []);
    } catch (error) {
      console.error("Error cargando vehículos:", error);
      setVehicles([]);
    }
  };

  // Inicializar: vehículos + mes inicial
  useEffect(() => {
    loadVehicles();
    setForm((prev) => ({ ...prev, initialPaymentMonth: nextTwoMonths[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextTwoMonths]);

  // Buscar cliente por DNI y refrescar vehículos
  const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dniValue = e.target.value;
    setForm((prev) => ({ ...prev, dni: dniValue }));

    if (dniValue.trim().length === 8) {
      try {
        const res = await api.get(
          `/clients/search/by-dni?dni=${encodeURIComponent(dniValue.trim())}`
        );
        if (res.data?.length > 0) {
          const c = res.data[0];
          setForm((prev) => ({
            ...prev,
            clientName: `${c.firstName} ${c.lastName}`,
          }));
          await loadVehicles(dniValue.trim());
        } else {
          setForm((prev) => ({ ...prev, clientName: "" }));
        }
      } catch (err) {
        console.error("Error buscando cliente:", err);
        setForm((prev) => ({ ...prev, clientName: "" }));
      }
    } else {
      setForm((prev) => ({ ...prev, clientName: "" }));
    }
  };

  // Selección de vehículo
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vehicleId = e.target.value;
    const vehicle =
      vehicles.find((v) => String(v.id) === String(vehicleId)) || null;
    setSelectedVehicle(vehicle);
    if (vehicle) {
      const priceStr = String(Number(vehicle.price || 0).toFixed(2));
      setForm((prev) => ({
        ...prev,
        vehicleId,
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
    } else {
      setForm((prev) => ({
        ...prev,
        vehicleId,
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
    }
  };

  // Resetear permuta cuando se destilda
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

  // Reglas de negocio (validaciones + balance). Sin autocompletar montos.
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
      if (newErrors.tradeIn || newErrors.prendario || newErrors.financiacion) {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVehicle,
    form.hasTradeIn,
    form.tradeInValue,
    form.downPayment,
    form.montoPrendario,
    form.montoFinanciacion,
    form.paymentType,
    maxPersonalFinancing,
  ]);

  // Calcular totales/valor cuota (base, sin tasas, para guardar)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVehicle,
    form.paymentType,
    form.installments,
    form.downPayment,
    form.montoPrendario,
    form.montoPersonal,
    form.montoFinanciacion,
    form.tradeInValue,
  ]);

  const hasErrors = Object.values(errors).some((msg) => !!msg);

  const requiresInstallments = form.paymentType === "anticipo_financiacion";
  const missingInstallments = requiresInstallments && !form.installments;

  // ---- Regla de composición del precio (solo para Anticipo + Financiación) ----
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

  // Cálculos SOLO para el preview con tasas desde la base
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

  // Guardar venta y descargar PDF desde backend
  const handleSaveSale = async () => {
    if (!selectedVehicle) {
      setAlert({
        open: true,
        message: "Debe seleccionar un vehículo.",
        severity: "warning",
      });
      return;
    }

    if (!form.paymentType) {
      setAlert({
        open: true,
        message: "Debe seleccionar la forma de pago.",
        severity: "warning",
      });
      return;
    }

    if (form.paymentType === "anticipo_financiacion" && !form.installments) {
      setAlert({
        open: true,
        message: "Debe seleccionar la cantidad de cuotas.",
        severity: "warning",
      });
      return;
    }

    // Validación de composición del precio (solo Anticipo + Financiación)
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

    const payload = {
      clientDni: form.dni.trim(),
      clientName: form.clientName.trim(),
      vehicleId: Number(selectedVehicle.id),
      basePrice: Number(selectedVehicle.price),
      hasTradeIn: !!form.hasTradeIn,
      tradeInValue: Number(form.tradeInValue) || 0,
      tradeInPlate: form.tradeInPlate.trim() || null,
      downPayment: Number(form.downPayment) || 0,
      prendarioAmount: Number(form.montoPrendario) || 0,
      personalAmount: Number(form.montoPersonal) || 0,
      inHouseAmount: Number(form.montoFinanciacion) || 0,
      finalPrice: Number(form.finalPrice) || 0,
      balance: Number(form.balance) || 0,
      paymentDay: Number(form.paymentDay),
      initialPaymentMonth: form.initialPaymentMonth,
      // provisoriamente usamos mismas cuotas para todos
      prendarioInstallments: Number(form.installments) || 0,
      personalInstallments: Number(form.installments) || 0,
      inHouseInstallments: Number(form.installments) || 0,
      // tasas en 0 hasta que las expongamos en backend
      prendarioMonthlyRate: 0,
      personalMonthlyRate: 0,
      inHouseMonthlyRate: 0,
    };

    try {
      const res = await api.post("/sales", payload, {
        headers: { "Content-Type": "application/json" },
      });
      const newSale = res.data;

      const pdfUrl = `${import.meta.env.VITE_API_URL}/sales/${newSale.id}/pdf`;
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `Comprobante-Venta-${(form.clientName || "cliente")
        .replace(/\s+/g, "_")
        .replace(/[^\w\-]/g, "")}-${newSale.id}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);

      setAlert({
        open: true,
        message: "Venta registrada y comprobante descargado correctamente.",
        severity: "success",
      });
      setPreviewOpen(false);
    } catch (err: any) {
      console.log("❌ Error guardando venta FULL:", err);
      console.log("❌ status:", err?.response?.status);
      console.log("❌ data:", err?.response?.data);
      console.log("❌ message:", err?.response?.data?.message);
      alert(
        `Error guardando venta: ${err?.response?.status} - ${
          err?.response?.data?.message || "sin mensaje"
        }`
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Registrar Venta
      </Typography>

      <Paper
        sx={{
          p: 3,
          backgroundColor: "#1e1e2f",
          borderRadius: 2,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {/* FORMULARIO (dos columnas) */}
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
                  setForm((prev) => ({ ...prev, hasTradeIn: e.target.checked }))
                }
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
                label="Patente de la Permuta"
                value={form.tradeInPlate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tradeInPlate: e.target.value.toUpperCase(),
                  }))
                }
                fullWidth
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

          {/* Anticipo */}
          {form.paymentType === "anticipo_financiacion" && (
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

          {/* Financiación Personal (in-house) */}
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

          {/* Cantidad de cuotas */}
          {form.paymentType === "anticipo_financiacion" && (
            <TextField
              select
              label="Cantidad de Cuotas"
              value={form.installments}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, installments: e.target.value }))
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
              {Array.from({ length: 36 }, (_, idx) => idx + 1).map((q) => (
                <MenuItem key={q} value={q}>
                  {q} cuotas
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Datos de cobro (solo si hay financiación) */}
          {form.paymentType === "anticipo_financiacion" && (
            <>
              <TextField
                select
                label="Día de pago"
                value={form.paymentDay}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentDay: Number(e.target.value),
                  }))
                }
                fullWidth
                sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
              >
                {[5, 10, 15, 30].map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Mes inicial de pago"
                value={form.initialPaymentMonth}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    initialPaymentMonth: e.target.value,
                  }))
                }
                fullWidth
                sx={{ input: { color: "#fff" }, label: { color: "#ccc" } }}
              >
                {nextTwoMonths.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </>
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
              !form.paymentType ||
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
        <DialogTitle>Previsualización del Comprobante de Venta</DialogTitle>
        <DialogContent>
          <Typography>Cliente: {form.clientName || "-"}</Typography>
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
            <>
              <Typography>
                Permuta: {formatPesos(form.tradeInValue)}
              </Typography>
              {form.tradeInPlate && (
                <Typography>Patente Permuta: {form.tradeInPlate}</Typography>
              )}
            </>
          )}

          {/* Valor de cuota total con financiación real */}
          {form.paymentType === "anticipo_financiacion" &&
            valorCuotaTotalConInteres > 0 && (
              <Typography>
                Valor de Cuota total (con financiación):{" "}
                {formatPesos(valorCuotaTotalConInteres)}
              </Typography>
            )}

          {/* Detalle de préstamos y financiaciones */}
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
              onClick={handleSaveSale}
              disabled={
                hasErrors ||
                !form.vehicleId ||
                !form.paymentType ||
                (form.paymentType === "anticipo_financiacion" &&
                  missingInstallments) ||
                compositionMismatch
              }
            >
              Vender y Descargar PDF
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

export default Sales;
