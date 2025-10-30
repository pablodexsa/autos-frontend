import { useState } from "react";
import { api } from "../api";
import { TextField, Button, Box } from "@mui/material";

export function VehicleForm({ onAdded }: { onAdded: () => void }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/vehicles", { brand, model, year, price: Number(price) });
      setBrand("");
      setModel("");
      setYear(new Date().getFullYear());
      setPrice("");
      onAdded();
    } catch (err) {
      console.error("❌ Error al crear vehículo:", err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <TextField label="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} required />
      <TextField label="Modelo" value={model} onChange={(e) => setModel(e.target.value)} required />
      <TextField type="number" label="Año" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
      <TextField type="number" label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <Button variant="contained" type="submit">Agregar Vehículo</Button>
    </Box>
  );
}
