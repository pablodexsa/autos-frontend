// src/pages/Settings/SettingsReservationRefundAmount.tsx
import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Stack } from "@mui/material";
import api from "../../api/api";

const SettingsReservationRefundAmount: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar valor actual desde backend
  useEffect(() => {
    api
      .get("/settings/reservations/refund-amount")
      .then((res) => {
        // backend: { reservationRefundAmount: number }
        const v = Number(res.data?.reservationRefundAmount);
        if (Number.isFinite(v) && v >= 0) {
          setValue(String(v));
        }
      })
      .catch((err) => {
        console.error("Error cargando monto de devolución de reserva:", err);
      });
  }, []);

  const handleSave = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      alert("Ingrese un importe válido (mayor o igual a 0).");
      return;
    }

    try {
      setLoading(true);
      // backend: PATCH /settings/reservations/refund-amount
      // body: { reservationRefundAmount: number }
      await api.patch("/settings/reservations/refund-amount", {
        reservationRefundAmount: num,
      });
      alert("Monto de devolución actualizado correctamente.");
    } catch (err) {
      console.error("Error guardando monto de devolución:", err);
      alert("No se pudo guardar el monto de devolución.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Monto de Devolución (cancelación de reserva)
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Definí el monto estándar a devolver cuando se cancela una reserva.
        Este valor se copia a la devolución al momento de la cancelación.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Monto de devolución (ARS)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </Stack>
    </Box>
  );
};

export default SettingsReservationRefundAmount;
