import { Box, Typography, Paper } from "@mui/material";
import SettingsLoanRates from "./Settings/SettingsLoanRates";

export default function SettingsPage() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Configuración
      </Typography>

      <Paper sx={{ p: 2 }}>
        <SettingsLoanRates />
      </Paper>
    </Box>
  );
}
