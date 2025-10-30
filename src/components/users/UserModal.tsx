import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";

export default function UserModal({ open, onClose, onSave, user }: any) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "vendedor" });

  useEffect(() => {
    if (user) {
      setForm({ ...user, password: "" });
    } else {
      setForm({ name: "", email: "", password: "", role: "vendedor" });
    }
  }, [user]);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
        />
        {!user && (
          <TextField
            label="Contraseña"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
          />
        )}
        <TextField
          select
          label="Rol"
          name="role"
          value={form.role}
          onChange={handleChange}
          fullWidth
        >
          <MenuItem value="admin">Administrador</MenuItem>
          <MenuItem value="vendedor">Vendedor</MenuItem>
          <MenuItem value="gerencia">Gerencia</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => onSave(form)}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
