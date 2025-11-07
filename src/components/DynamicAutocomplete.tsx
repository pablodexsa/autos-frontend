// src/components/DynamicAutocomplete.tsx
import { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { api } from "../api";

interface DynamicAutocompleteProps {
  label: string;
  endpoint: string; // ejemplo: '/brands', '/models', '/versions'
  parentId?: number; // id del elemento padre (marca → modelo, modelo → versión)
  value: string;
  onChange: (val: string, id?: number) => void;
}

export function DynamicAutocomplete({
  label,
  endpoint,
  parentId,
  value,
  onChange,
}: DynamicAutocompleteProps) {
  const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newValue, setNewValue] = useState("");

  // 🔄 Cargar opciones
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        let url = endpoint;
        if (parentId) url = `${endpoint}/${parentId}/${label === "Modelo" ? "models" : "versions"}`;
        const res = await api.get(url);
        setOptions(res.data);
      } catch (err) {
        console.error(`❌ Error al cargar ${label}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [endpoint, parentId, label]);

  // 💾 Guardar nueva opción
  const handleAdd = async () => {
    if (!newValue.trim()) return;
    try {
      let url = endpoint;
      const payload: any = { name: newValue.trim() };

      if (parentId) {
        // si tiene padre, la creamos bajo su ruta anidada
        url = `${endpoint}/${parentId}/${label === "Modelo" ? "models" : "versions"}`;
      } else if (label === "Modelo") {
        payload.brandId = parentId;
      } else if (label === "Versión") {
        payload.modelId = parentId;
      }

      const res = await api.post(url, payload);
      const created = res.data;
      setOptions((prev) => [...prev, created]);
      onChange(created.name, created.id);
      setOpenDialog(false);
      setNewValue("");
    } catch (err) {
      console.error(`❌ Error al agregar ${label}:`, err);
    }
  };

  return (
    <>
      <Autocomplete
        loading={loading}
        options={[...options.map((o) => o.name), `➕ Agregar nueva ${label.toLowerCase()}`]}
        value={value || ""}
        onChange={(e, val) => {
          if (!val) return;
          if (val.startsWith("➕")) {
            setOpenDialog(true);
          } else {
            const selected = options.find((o) => o.name === val);
            onChange(val, selected?.id);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          "& .MuiAutocomplete-option:last-of-type": {
            backgroundColor: "#fff17655",
            fontWeight: "bold",
          },
        }}
      />

      {/* Modal agregar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Agregar nueva {label.toLowerCase()}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={`Nombre de la ${label.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdd}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
