import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import api from "../api/api";

const BudgetReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    plate: "",
    dni: "",
    seller: "",
    startDate: "",
    endDate: "",
  });

  // 🔹 Obtener reportes filtrados
  const fetchReports = async () => {
    try {
      const res = await api.get("/budget-reports", { params: filters });
      setReports(res.data);
    } catch (error) {
      console.error("❌ Error cargando reportes:", error);
    }
  };

  useEffect(() => {
    fetchReports();

    // 🧩 Detectar si se creó un nuevo presupuesto
    const shouldRefresh = localStorage.getItem("refreshBudgetsList");
    if (shouldRefresh === "true") {
      localStorage.removeItem("refreshBudgetsList");
      fetchReports();
    }
  }, []);

  // 🧾 Descargar PDF profesional desde backend
  const downloadPDF = async (report: any) => {
    try {
      // 📎 Usa el endpoint /budgets/:id/pdf que genera el PDF completo con logo y legales
      const pdfUrl = `${import.meta.env.VITE_API_URL}/budgets/${report.budgetId}/pdf`;

      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error("Error al descargar el PDF desde el servidor.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 📅 Nombre del archivo con fecha y cliente
      const today = new Date().toISOString().split("T")[0];
      const lastName = report.client?.lastName || "Cliente";
      const fileName = `Presupuesto-${lastName}-${today}-${report.id}.pdf`;

      // 📥 Descargar automáticamente
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 👁️ También abrir en nueva pestaña
      window.open(url, "_blank");

      // Limpieza
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      alert("No se pudo generar el PDF del presupuesto.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Reportes de Presupuestos
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2}>
          <TextField
            label="Patente"
            value={filters.plate}
            onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
          />
          <TextField
            label="DNI"
            value={filters.dni}
            onChange={(e) => setFilters({ ...filters, dni: e.target.value })}
          />
          <TextField
            label="Vendedor"
            value={filters.seller}
            onChange={(e) =>
              setFilters({ ...filters, seller: e.target.value })
            }
          />
          <Button variant="contained" onClick={fetchReports}>
            Buscar
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* antes: <TableCell>ID</TableCell> */}
              <TableCell>N° Presupuesto</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Patente</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Vendedor</TableCell>
              <TableCell>Forma de Pago</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                {/* antes: <TableCell>{r.id}</TableCell> */}
                <TableCell>{r.budgetId ?? r.id}</TableCell>
                <TableCell>{`${r.vehicle.brand} ${r.vehicle.model} ${
                  r.vehicle.versionName || ""
                }`}</TableCell>
                <TableCell>{r.vehicle.plate}</TableCell>
                <TableCell>{`${r.client.firstName} ${r.client.lastName}`}</TableCell>
                <TableCell>{r.seller?.name || "Anónimo"}</TableCell>
                <TableCell>{r.paymentType}</TableCell>
                <TableCell>${r.listPrice}</TableCell>
                <TableCell>
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => downloadPDF(r)}>
                    <Download />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetReports;
