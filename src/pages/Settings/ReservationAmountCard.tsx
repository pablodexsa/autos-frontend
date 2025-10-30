import React, { useEffect, useState } from "react";
import { Paper, TextField, Button, Typography, Box } from "@mui/material";
import { getReservationAmount, setReservationAmount } from "../../api/settings";

export const ReservationAmountCard: React.FC = () => {
  const [amount, setAmount] = useState<number>(500000);

  useEffect(() => {
    (async () => {
      try {
        const a = await getReservationAmount();
        setAmount(a);
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    const a = await setReservationAmount(amount);
    setAmount(a);
    alert("Monto de reserva actualizado");
  };

  return (
    <Paper sx={{ p: 3, background: "#1e1e2f", borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>Configuración de Reserva</Typography>
      <Box display="flex" gap={2} alignItems="center">
        <TextField
          label="Monto de reserva"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          sx={{ input: { color: "#fff" }, label: { color: "#ccc" }, width: 260 }}
        />
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </Box>
    </Paper>
  );
};
