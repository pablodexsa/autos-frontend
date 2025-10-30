import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { getRoles, createRole, updateRole, deleteRole } from "../api/rolesApi";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState("");

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSave = async () => {
    if (selectedRole) {
      await updateRole(selectedRole.id, roleName);
    } else {
      await createRole(roleName);
    }
    setModalOpen(false);
    setSelectedRole(null);
    setRoleName("");
    loadRoles();
  };

  const handleDelete = async (id: number) => {
    await deleteRole(id);
    loadRoles();
  };

  return (
    <Card sx={{ bgcolor: "#1c1c2e", color: "#fff", p: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Gestión de Roles
        </Typography>
        <Button
          variant="contained"
          sx={{ mb: 2 }}
          onClick={() => setModalOpen(true)}
        >
          + Nuevo Rol
        </Button>
        <Box>
          {roles.map((role) => (
            <Box
              key={role.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
                p: 1,
                bgcolor: "#2a2a40",
                borderRadius: 1,
              }}
            >
              <Typography>{role.name}</Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, color: "#fff", borderColor: "#555" }}
                  onClick={() => {
                    setSelectedRole(role);
                    setRoleName(role.name);
                    setModalOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(role.id)}
                >
                  Eliminar
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>{selectedRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre del rol"
            fullWidth
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
