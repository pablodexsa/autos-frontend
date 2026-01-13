import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../../api/api"; // <- esta ruta ya dijiste que funciona

const SettingsMaxPersonalFinancing: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Cargar valor actual
  useEffect(() => {
    const fetchValue = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await api.get("/settings/financing/personal-max");
        // backend: { maxPersonalAmount: number }
        const raw = res.data?.maxPersonalAmount;
        const n = Number(raw);

        if (!Number.isFinite(n) || n <= 0) {
          setLoadError("No se pudo cargar el valor actual.");
          setValue("");
        } else {
          setValue(String(n));
        }
      } catch (error) {
        console.error(error);
        setLoadError("No se pudo cargar el valor actual.");
      } finally {
        setLoading(false);
      }
    };

    fetchValue();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, ""); // solo dígitos
    setValue(v);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setSaveError("El valor debe ser un número mayor a 0.");
      return;
    }

    try {
      setSaving(true);

      await api.patch("/settings/financing/personal-max", {
        maxPersonalAmount: n,
      });

      setSaveSuccess("Valor actualizado correctamente.");
    } catch (error) {
      console.error(error);
      setSaveError("Error al guardar el valor.");
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Límite de Financiación Personal
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Definí el monto máximo permitido para la financiación personal
        (in-house). Este valor se usa para validar las ventas en el módulo de
        Ventas.
      </Typography>

      <Stack spacing={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Monto máximo de financiación personal"
            variant="outlined"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            fullWidth
            InputProps={{
              inputMode: "numeric",
            }}
          />

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={disabled || !value}
          >
            {saving ? <CircularProgress size={20} /> : "Guardar"}
          </Button>
        </Box>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando valor actual...
          </Typography>
        )}

        {loadError && <Alert severity="error">{loadError}</Alert>}
        {saveError && <Alert severity="error">{saveError}</Alert>}
        {saveSuccess && <Alert severity="success">{saveSuccess}</Alert>}
      </Stack>
    </Box>
  );
};

export default SettingsMaxPersonalFinancing;
