import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Box
} from "@mui/material";

export function InstallmentSettingsPanel() {
  const [settings, setSettings] = useState<any[]>([]);
  const [newInstallments, setNewInstallments] = useState<number>(0);
  const [newPercentage, setNewPercentage] = useState<number>(0);

  const load = () => {
    api.get("/installment-settings").then(res => setSettings(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newInstallments || !newPercentage) return;
    await api.post("/installment-settings", {
      installments: newInstallments,
      percentage: newPercentage,
    });
    setNewInstallments(0);
    setNewPercentage(0);
    load();
  };

  const handleUpdate = async (id: number, percentage: number) => {
    await api.put(`/installment-settings/${id}`, { percentage });
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/installment-settings/${id}`);
    load();
  };

  return (
    <Box>
      <h2>Configuración de Financiación</h2>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Cuotas"
          type="number"
          value={newInstallments}
          onChange={(e) => setNewInstallments(Number(e.target.value))}
        />
        <TextField
          label="% Aumento"
          type="number"
          value={newPercentage}
          onChange={(e) => setNewPercentage(Number(e.target.value))}
        />
        <Button variant="contained" onClick={handleAdd}>Agregar</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cuotas</TableCell>
            <TableCell>% Aumento</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settings.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.installments}</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={s.percentage}
                  onChange={(e) =>
                    setSettings(settings.map(item =>
                      item.id === s.id ? { ...item, percentage: Number(e.target.value) } : item
                    ))
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleUpdate(s.id, s.percentage)}
                  size="small"
                  variant="outlined"
                >
                  Guardar
                </Button>{" "}
                <Button
                  onClick={() => handleDelete(s.id)}
                  size="small"
                  variant="outlined"
                  color="error"
                >
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
