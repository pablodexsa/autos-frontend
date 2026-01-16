import { Box, Typography, Paper, Stack } from "@mui/material";
import SettingsLoanRates from "./Settings/SettingsLoanRates";
import SettingsMaxPersonalFinancing from "./Settings/SettingsMaxPersonalFinancing";
import SettingsReservationAmount from "./Settings/SettingsReservationAmount";

export default function SettingsPage() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Configuración
      </Typography>

      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <SettingsLoanRates />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <SettingsMaxPersonalFinancing />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <SettingsReservationAmount />
        </Paper>
      </Stack>
    </Box>
  );
}
