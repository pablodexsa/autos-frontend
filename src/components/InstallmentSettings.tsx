import { useEffect, useState } from "react";
import api from "../api/api";
import { TextField, Button, Box, Typography } from "@mui/material";

type Setting = {
  installments: number;
  percentage: number;
};

export function InstallmentSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get("/installments");
      setSettings(res.data);
    } catch (e) {
      console.error("❌ Error al cargar configuración", e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (index: number, value: number) => {
    const updated = [...settings];
    updated[index].percentage = value;
    setSettings(updated);
  };

  const save = async () => {
    try {
      await api.post("/installments", settings);
      alert("✅ Configuración guardada");
    } catch (e) {
      console.error("❌ Error al guardar configuración", e);
      alert("❌ Error al guardar");
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <Box>
      <Typography variant="h6" mb={2}>Configurar Porcentajes de Financiación</Typography>
      {settings.map((setting, index) => (
        <Box key={setting.installments} mb={2} display="flex" gap={2} alignItems="center">
          <Typography>{setting.installments} cuotas:</Typography>
          <TextField
            type="number"
            value={setting.percentage}
            onChange={(e) => updateSetting(index, parseInt(e.target.value))}
            label="% Aumento"
            variant="outlined"
          />
        </Box>
      ))}
      <Button variant="contained" onClick={save}>Guardar Cambios</Button>
    </Box>
  );
}
