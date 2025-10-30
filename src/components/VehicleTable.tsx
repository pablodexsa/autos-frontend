import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

export function VehicleTable({ vehicles }: { vehicles: any[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Marca</TableCell>
          <TableCell>Modelo</TableCell>
          <TableCell>Año</TableCell>
          <TableCell>Precio</TableCell>
          <TableCell>Estado</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {vehicles.map((v) => (
          <TableRow key={v.id}>
            <TableCell>{v.brand}</TableCell>
            <TableCell>{v.model}</TableCell>
            <TableCell>{v.year}</TableCell>
            <TableCell>${Number(v.price).toFixed(2)}</TableCell>
            <TableCell>{v.sold ? "Vendido" : "Disponible"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
