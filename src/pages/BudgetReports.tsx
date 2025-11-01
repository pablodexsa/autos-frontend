import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import api from "../api/api"; // ✅ usa tu cliente api centralizado
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
      const res = await api.get("/budget-reports", { params: filters }); // ✅ sin localhost
      setReports(res.data);
    } catch (error) {
      console.error("❌ Error cargando reportes:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 🧾 Generar PDF
  const generatePDF = (report: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("De Grazia Automotores", 20, 20);
    doc.setFontSize(10);
    doc.text(`Presupuesto Nº ${report.id}`, 20, 30);
    doc.text(`Fecha: ${new Date(report.createdAt).toLocaleDateString()}`, 150, 30);
    doc.text(`Vendedor: ${report.seller?.name || "Anónimo"}`, 20, 40);
    doc.text(`Cliente: ${report.client.firstName} ${report.client.lastName}`, 20, 50);

    autoTable(doc, {
      startY: 60,
      head: [["Vehículo", "Forma de Pago", "Precio de lista", "Cuotas", "Valor Cuota", "Anticipo"]],
      body: [
        [
          `${report.vehicle.brand} ${report.vehicle.model} ${report.vehicle.versionName || ""} (${report.vehicle.plate || "sin patente"})`,
          report.paymentType,
          `$${report.listPrice}`,
          report.installments || "-",
          report.installmentValue ? `$${report.installmentValue}` : "-",
          report.downPayment ? `$${report.downPayment}` : "-",
        ],
      ],
    });

    doc.text("Este presupuesto es válido por 3 días hábiles.", 20, (doc as any).lastAutoTable.finalY + 20);
    doc.save(`Presupuesto-${report.id}.pdf`);
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
            onChange={(e) => setFilters({ ...filters, seller: e.target.value })}
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
              <TableCell>ID</TableCell>
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
                <TableCell>{r.id}</TableCell>
                <TableCell>{`${r.vehicle.brand} ${r.vehicle.model} ${r.vehicle.versionName || ""}`}</TableCell>
                <TableCell>{r.vehicle.plate}</TableCell>
                <TableCell>{`${r.client.firstName} ${r.client.lastName}`}</TableCell>
                <TableCell>{r.seller?.name || "Anónimo"}</TableCell>
                <TableCell>{r.paymentType}</TableCell>
                <TableCell>${r.listPrice}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => generatePDF(r)}>
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
