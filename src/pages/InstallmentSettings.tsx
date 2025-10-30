import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from "@mui/material";

export default function InstallmentSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [installments, setInstallments] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedInstallments, setEditedInstallments] = useState<number>(0);
  const [editedPercentage, setEditedPercentage] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const load = () => {
    api.get("/installment-settings").then((res) => setSettings(res.data));
  };

  const handleAdd = async () => {
    if (!installments || !percentage) return;
    await api.post("/installment-settings", { installments, percentage });
    setInstallments(0);
    setPercentage(0);
    load();
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm("¿Estás seguro de que querés eliminar esta configuración?");
    if (!confirm) return;
    await api.delete(`/installment-settings/${id}`);
    load();
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setEditedInstallments(s.installments);
    setEditedPercentage(s.percentage);
  };

  const handleSave = async (id: number) => {
    await api.patch(`/installment-settings/${id}`, {
      installments: editedInstallments,
      percentage: editedPercentage,
    });
    setEditingId(null);
    setSnackbarOpen(true);
    load();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <h1>Configuración de Porcentajes por Cuotas</h1>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          type="number"
          label="Cantidad de Cuotas"
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
        />
        <TextField
          type="number"
          label="Porcentaje de Aumento (%)"
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
        />
        <Button variant="contained" onClick={handleAdd}>
          Agregar
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cuotas</TableCell>
            <TableCell>Porcentaje (%)</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settings.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                {editingId === s.id ? (
                  <TextField
                    type="number"
                    value={editedInstallments}
                    onChange={(e) => setEditedInstallments(Number(e.target.value))}
                    size="small"
                  />
                ) : (
                  s.installments
                )}
              </TableCell>
              <TableCell>
                {editingId === s.id ? (
                  <TextField
                    type="number"
                    value={editedPercentage}
                    onChange={(e) => setEditedPercentage(Number(e.target.value))}
                    size="small"
                  />
                ) : (
                  s.percentage
                )}
              </TableCell>
              <TableCell>
                {editingId === s.id ? (
                  <Button variant="contained" onClick={() => handleSave(s.id)}>
                    Guardar
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={() => handleEdit(s)}>
                    Editar
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDelete(s.id)}
                  sx={{ ml: 1 }}
                >
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" variant="filled">
          Configuración actualizada correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
}
