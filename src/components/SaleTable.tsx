import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Sale {
  id: number;
  saleDate: string;
  saleType: string;
  finalPrice?: number;
  downPayment?: number | null;
  installments?: number | null;
  installmentValue?: number | null;
  vehicle?: {
    brand: string;
    model: string;
    versionName?: string;
    plate: string;
    price: number;
  };
  client?: {
    firstName: string;
    lastName: string;
    dni: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
  };
}

interface SaleTableProps {
  sales: Sale[];
}

export const SaleTable: React.FC<SaleTableProps> = ({ sales }) => {
  if (!sales || sales.length === 0) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        No hay ventas registradas aún.
      </Typography>
    );
  }

  const handleDownloadPDF = (sale: Sale) => {
    const doc = new jsPDF();

    // 🔹 Encabezado
    doc.setFontSize(18);
    doc.text("DE GRAZIA AUTOMOTORES", 14, 20);
    doc.setFontSize(12);
    doc.text("Recibo oficial de venta", 14, 28);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString("es-AR")}`, 14, 36);
    doc.line(14, 38, 195, 38);

    // 🔹 Datos principales
    doc.setFontSize(11);
    doc.text(`ID de Venta: ${sale.id}`, 14, 48);
    doc.text(`Fecha de Venta: ${new Date(sale.saleDate).toLocaleString("es-AR")}`, 14, 56);
    doc.text(`Tipo de Venta: ${sale.saleType}`, 14, 64);

    // 🔹 Vendedor y cliente
    const sellerName = sale.seller
      ? `${sale.seller.firstName} ${sale.seller.lastName}`
      : "No registrado";
    const clientName = sale.client
      ? `${sale.client.firstName} ${sale.client.lastName} (DNI: ${sale.client.dni})`
      : "No registrado";

    doc.text(`Vendedor: ${sellerName}`, 14, 74);
    doc.text(`Cliente: ${clientName}`, 14, 82);

    // 🔹 Tabla de detalles del vehículo
    const vehiculo = sale.vehicle;
    autoTable(doc, {
      startY: 92,
      head: [["Campo", "Detalle"]],
      body: [
        ["Marca", vehiculo?.brand || "-"],
        ["Modelo", vehiculo?.model || "-"],
        ["Versión", vehiculo?.versionName || "-"],
        ["Patente", vehiculo?.plate || "-"],
        ["Precio Base", `$${vehiculo?.price?.toLocaleString() || "-"}`],
        ["Anticipo", sale.downPayment ? `$${sale.downPayment}` : "-"],
        ["Cuotas", sale.installments || "-"],
[
  "Valor por Cuota",
  sale.installmentValue && !isNaN(Number(sale.installmentValue))
    ? `$${Number(sale.installmentValue).toFixed(2)}`
    : "-",
],

        [
          "Precio Final",
          `$${(sale.finalPrice || vehiculo?.price || 0).toLocaleString()}`,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 150, 136] },
    });

    // 🔹 Pie de página elegante
    const pageHeight = doc.internal.pageSize.height;
    doc.line(14, pageHeight - 30, 195, pageHeight - 30);
    doc.setFontSize(9);
    doc.text(
      "De Grazia Automotores | Av. Siempre Viva 123 | Tel: (000) 123-4567 | www.degraziaautomotores.com",
      14,
      pageHeight - 22
    );
    doc.text(
      "Este comprobante es válido como registro interno de venta. Todos los importes se expresan en pesos argentinos.",
      14,
      pageHeight - 16
    );

    // 🔹 Guardar con nombre detallado
    const nombreArchivo = `Venta_${sale.id}_${vehiculo?.brand || "vehiculo"}.pdf`;
    doc.save(nombreArchivo);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        mt: 4,
        borderRadius: 2,
        backgroundColor: "#1e1e2f",
      }}
    >
      <Typography
        variant="h6"
        align="center"
        sx={{ color: "#fff", pt: 2, pb: 1 }}
      >
        Listado de Ventas
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "#00e676" }}>ID</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Vehículo</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Patente</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Cliente</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Tipo de Venta</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Vendedor</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Precio</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Fecha</TableCell>
            <TableCell sx={{ color: "#00e676" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell sx={{ color: "#fff" }}>{sale.id}</TableCell>
              <TableCell sx={{ color: "#fff" }}>
                {sale.vehicle
                  ? `${sale.vehicle.brand} ${sale.vehicle.model} ${sale.vehicle.versionName || ""
                    }`
                  : "-"}
              </TableCell>
              <TableCell sx={{ color: "#fff" }}>
                {sale.vehicle?.plate || "-"}
              </TableCell>
              <TableCell sx={{ color: "#fff" }}>
                {sale.client
                  ? `${sale.client.firstName} ${sale.client.lastName}`
                  : "-"}
              </TableCell>
              <TableCell sx={{ color: "#fff" }}>{sale.saleType}</TableCell>
              <TableCell sx={{ color: "#fff" }}>
                {sale.seller
                  ? `${sale.seller.firstName} ${sale.seller.lastName}`
                  : "-"}
              </TableCell>
              <TableCell sx={{ color: "#fff" }}>
                $
                {(sale.finalPrice ||
                  sale.vehicle?.price ||
                  0).toLocaleString()}
              </TableCell>
              <TableCell sx={{ color: "#fff" }}>
                {sale.saleDate
                  ? new Date(sale.saleDate).toLocaleDateString("es-AR")
                  : "-"}
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={() => handleDownloadPDF(sale)}
                >
                  Descargar PDF
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
