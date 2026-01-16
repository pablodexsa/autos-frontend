// src/pages/Settings/SettingsReservationAmount.tsx
import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Stack } from "@mui/material";
import api from "../../api/api";

const SettingsReservationAmount: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar valor actual desde backend
  useEffect(() => {
    api
      .get("/settings/reservations/amount")
      .then((res) => {
        // backend: { reservationAmount: number }
        const v = Number(res.data?.reservationAmount);
        if (Number.isFinite(v) && v > 0) {
          setValue(String(v));
        }
      })
      .catch((err) => {
        console.error("Error cargando importe de reserva:", err);
      });
  }, []);

  const handleSave = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      alert("Ingrese un importe válido mayor a 0.");
      return;
    }

    try {
      setLoading(true);
      // backend: PATCH /settings/reservations/amount
      // body: { reservationAmount: number }
      await api.patch("/settings/reservations/amount", {
        reservationAmount: num,
      });
      alert("Importe de reserva actualizado correctamente.");
    } catch (err) {
      console.error("Error guardando importe de reserva:", err);
      alert("No se pudo guardar el importe de reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Importe de Reserva
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Definí el importe estándar que se cobrará al generar una reserva.
        Este valor se usa como monto fijo en el módulo de Reservas.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Importe de reserva (ARS)"
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

export default SettingsReservationAmount;
