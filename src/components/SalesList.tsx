import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography
} from "@mui/material";

export function SalesList() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    api.get("/sales").then((res) => setSales(res.data));
  }, []);

  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ m: 2 }}>
        Ventas Registradas
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Vehículo</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Tipo de Venta</TableCell>
            <TableCell>Precio</TableCell>
            <TableCell>Anticipo</TableCell>
            <TableCell>Cuotas</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale: any) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.id}</TableCell>
              <TableCell>{sale.vehicle?.brand} {sale.vehicle?.model} ({sale.vehicle?.year})</TableCell>
              <TableCell>{sale.saleDate}</TableCell>
              <TableCell>{sale.saleType}</TableCell>
              <TableCell>${Number(sale.price).toLocaleString()}</TableCell>
              <TableCell>{sale.downPayment ? `$${Number(sale.downPayment).toLocaleString()}` : "-"}</TableCell>
              <TableCell>{sale.installments ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
