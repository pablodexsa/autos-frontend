import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import { getUsers, createUser, updateUser, deleteUser } from "../api/usersApi";
import { getRoles } from "../api/rolesApi";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });

  const loadUsers = async () => setUsers(await getUsers());
  const loadRoles = async () => setRoles(await getRoles());

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const handleSave = async () => {
    if (selectedUser) await updateUser(selectedUser.id, form);
    else await createUser(form);

    setModalOpen(false);
    setSelectedUser(null);
    setForm({ name: "", email: "", password: "", role: "" });
    loadUsers();
  };

  const handleDelete = async () => {
    if (selectedUser) await deleteUser(selectedUser.id);
    setDeleteOpen(false);
    setSelectedUser(null);
    loadUsers();
  };

  return (
    <Card sx={{ bgcolor: "#1c1c2e", color: "#fff", p: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>Gestión de Usuarios</Typography>
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => setModalOpen(true)}>
          + Nuevo Usuario
        </Button>

        <Box>
          {users.map((user) => (
            <Box key={user.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1, p: 1, bgcolor: "#2a2a40", borderRadius: 1 }}>
              <Typography>{user.name} ({user.role})</Typography>
              <Box>
                <Button variant="outlined" size="small" sx={{ mr: 1, color: "#fff", borderColor: "#555" }}
                  onClick={() => { setSelectedUser(user); setForm({ ...user, password: "" }); setModalOpen(true); }}
                >Editar</Button>
                <Button variant="contained" size="small" color="error"
                  onClick={() => { setSelectedUser(user); setDeleteOpen(true); }}
                >Eliminar</Button>
              </Box>
            </Box>
          ))}
          {users.length === 0 && <Typography sx={{ mt: 2, color: "#aaa" }}>No hay usuarios cargados</Typography>}
        </Box>
      </CardContent>

      {/* Modal de usuario */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Nombre" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          {!selectedUser && <TextField label="Contraseña" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />}
          <TextField select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth>
            {roles.map((r) => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo eliminar */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Eliminar Usuario</DialogTitle>
        <DialogContent>¿Seguro que quieres eliminar a {selectedUser?.name}?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
