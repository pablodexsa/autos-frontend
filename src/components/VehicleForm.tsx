// src/components/VehicleForm.tsx
import { useState } from "react";
import { api } from "../api";
import { TextField, Button, Box } from "@mui/material";
import { DynamicAutocomplete } from "../components/DynamicAutocomplete";

export function VehicleForm({ onAdded }: { onAdded: () => void }) {
  const [brand, setBrand] = useState("");
  const [brandId, setBrandId] = useState<number | undefined>();
  const [model, setModel] = useState("");
  const [modelId, setModelId] = useState<number | undefined>();
  const [version, setVersion] = useState("");
  const [versionId, setVersionId] = useState<number | undefined>();
  const [year, setYear] = useState(new Date().getFullYear());
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionId) return alert("Seleccioná marca, modelo y versión");
    try {
      await api.post("/vehicles", {
        versionId,
        year: Number(year),
        price: Number(price),
      });
      setBrand("");
      setModel("");
      setVersion("");
      setBrandId(undefined);
      setModelId(undefined);
      setVersionId(undefined);
      setYear(new Date().getFullYear());
      setPrice("");
      onAdded();
    } catch (err) {
      console.error("❌ Error al crear vehículo:", err);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}
    >
      <DynamicAutocomplete
        label="Marca"
        endpoint="/brands"
        value={brand}
        onChange={(val, id) => {
          setBrand(val);
          setBrandId(id);
          setModel("");
          setModelId(undefined);
          setVersion("");
          setVersionId(undefined);
        }}
      />

      <DynamicAutocomplete
        label="Modelo"
        endpoint="/models"
        parentId={brandId}
        value={model}
        onChange={(val, id) => {
          setModel(val);
          setModelId(id);
          setVersion("");
          setVersionId(undefined);
        }}
      />

      <DynamicAutocomplete
        label="Versión"
        endpoint="/models"
        parentId={modelId}
        value={version}
        onChange={(val, id) => {
          setVersion(val);
          setVersionId(id);
        }}
      />

      <TextField
        type="number"
        label="Año"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        required
      />
      <TextField
        type="number"
        label="Precio"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <Button variant="contained" type="submit">
        Agregar Vehículo
      </Button>
    </Box>
  );
}
