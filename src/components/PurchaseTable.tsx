import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface Purchase {
  id: number;
  purchaseDate: string;
  purchasePrice: number | string;
  sellerName: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number;
  };
}

interface PurchaseTableProps {
  purchases: Purchase[];
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({ purchases }) => {
  return (
    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#388e3c" }}>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Vehículo</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Precio Compra</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Vendedor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {purchases.length > 0 ? (
            purchases.map((p, idx) => (
              <TableRow key={p.id} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {p.vehicle
                    ? `${p.vehicle.brand} ${p.vehicle.model} (${p.vehicle.year})`
                    : "-"}
                </TableCell>
                <TableCell>
                  ${Number(p.purchasePrice ?? 0).toLocaleString("es-AR")}
                </TableCell>
                <TableCell>{p.sellerName || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                No hay compras registradas aún.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export { PurchaseTable };
