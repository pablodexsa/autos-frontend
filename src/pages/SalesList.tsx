import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/api';

interface Vehicle {
  brand: string;
  model: string;
  versionName?: string;
  plate?: string;
}

interface Sale {
  id: number;
  clientName: string;
  clientDni: string;
  vehicle: Vehicle;
  basePrice: number;
  tradeInValue: number;
  downPayment: number;
  prendarioAmount: number;
  personalAmount: number;
  inHouseAmount: number;
  finalPrice: number;
  balance: number;
  createdAt: string;
  paymentDay: number;
  initialPaymentMonth: string;
}

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get('/sales');
        setSales(res.data);
      } catch (err) {
        console.error('Error fetching sales', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const handleOpen = (sale: Sale) => {
    setSelectedSale(sale);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSale(null);
  };

  // 📄 Export general de todas las ventas
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const watermarkText = 'DE GRAZIA AUTOMOTORES';

    // 🔹 Marca de agua
    doc.setFontSize(40);
    doc.setTextColor(240, 240, 240);
    doc.text(watermarkText, 35, 150, { angle: 45 });

    // 🔹 Título
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Ventas', 14, 20);

    const rows = sales.map((s) => [
      s.id,
      s.clientName || '-',
      s.clientDni || '-',
      `${s.vehicle?.brand || ''} ${s.vehicle?.model || ''}`,
      `$ ${s.finalPrice.toLocaleString()}`,
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Cliente', 'DNI', 'Vehículo', 'Precio Final', 'Fecha']],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 110, 170] },
    });

    doc.save('reporte-ventas.pdf');
  };

  // 📥 Descargar comprobante individual
  const handleDownloadPdf = async (saleId: number, clientName: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/sales/${saleId}/pdf`);
      if (!response.ok) throw new Error('No se pudo generar el PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `Comprobante-Venta-${clientName || 'cliente'}-${saleId}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando comprobante PDF:', error);
    }
  };

  if (loading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Cargando ventas...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Listado de Ventas
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Precio Final</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
                <TableCell align="center">Comprobante PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay ventas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.clientName}</TableCell>
                    <TableCell>{s.clientDni}</TableCell>
                    <TableCell>
                      {s.vehicle?.brand} {s.vehicle?.model}
                    </TableCell>
                    <TableCell>${s.finalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleOpen(s)}
                      >
                        Ver Detalle
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Descargar comprobante PDF">
                        <IconButton
                          color="error"
                          onClick={() => handleDownloadPdf(s.id, s.clientName)}
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={handleExportPDF}>
          Exportar Reporte PDF
        </Button>
      </Box>

      {/* 🧾 Modal de detalle */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Detalle de Venta #{selectedSale?.id}</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Cliente: {selectedSale.clientName} ({selectedSale.clientDni})
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Vehículo: {selectedSale.vehicle?.brand} {selectedSale.vehicle?.model}{' '}
                {selectedSale.vehicle?.versionName || ''}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Fecha de venta:{' '}
                {new Date(selectedSale.createdAt).toLocaleDateString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2">
                Precio base: ${selectedSale.basePrice.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Valor permuta: ${selectedSale.tradeInValue.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Anticipo: ${selectedSale.downPayment.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Financiación Prendaria: ${selectedSale.prendarioAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Financiación Personal: ${selectedSale.personalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Financiación Interna: ${selectedSale.inHouseAmount.toLocaleString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="primary">
                Precio Final: ${selectedSale.finalPrice.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Día de pago: {selectedSale.paymentDay}
              </Typography>
              <Typography variant="body2">
                Mes inicial de pago: {selectedSale.initialPaymentMonth}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SalesList;
