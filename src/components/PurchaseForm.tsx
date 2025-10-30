import { useState } from "react";
import { api } from "../api";
import { TextField, Button, Box } from "@mui/material";

export function PurchaseForm({ onAdded }: { onAdded: () => void }) {
  const [vehicleId, setVehicleId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [price, setPrice] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [document, setDocument] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("vehicleId", vehicleId);
      formData.append("purchaseDate", purchaseDate);
      formData.append("price", price);
      formData.append("sellerName", sellerName);
      if (document) {
        formData.append("document", document);
      }

      await api.post("/purchases", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVehicleId("");
      setPurchaseDate("");
      setPrice("");
      setSellerName("");
      setDocument(null);
      onAdded();
    } catch (err) {
      console.error("❌ Error al registrar compra:", err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <TextField
        label="ID Vehículo"
        value={vehicleId}
        onChange={(e) => setVehicleId(e.target.value)}
        required
      />
      <TextField
        type="date"
        label="Fecha de compra"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        required
      />
      <TextField
        type="number"
        label="Precio"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <TextField
        label="Nombre del vendedor"
        value={sellerName}
        onChange={(e) => setSellerName(e.target.value)}
        required
      />
      <Button variant="contained" component="label">
        Subir documento
        <input type="file" hidden onChange={(e) => setDocument(e.target.files ? e.target.files[0] : null)} />
      </Button>
      <Button variant="contained" type="submit">Registrar Compra</Button>
    </Box>
  );
}
