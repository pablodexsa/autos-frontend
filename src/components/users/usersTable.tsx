import React from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
} from "@mui/material";

interface UsersTableProps {
  users: any[];
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

export default function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  return (
    <TableContainer component={Paper} sx={{ bgcolor: "#1c1c2e", color: "#fff" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "#E0E0E0" }}>Nombre</TableCell>
            <TableCell sx={{ color: "#E0E0E0" }}>Email</TableCell>
            <TableCell sx={{ color: "#E0E0E0" }}>Rol</TableCell>
            <TableCell sx={{ color: "#E0E0E0" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell sx={{ color: "#E0E0E0" }}>{user.name}</TableCell>
              <TableCell sx={{ color: "#E0E0E0" }}>{user.email}</TableCell>
              <TableCell sx={{ color: "#E0E0E0" }}>{user.role}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, color: "#fff", borderColor: "#555" }}
                  onClick={() => onEdit(user)}
                >
                  Editar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  onClick={() => onDelete(user)}
                >
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center", color: "#aaa" }}>
                No hay usuarios cargados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
