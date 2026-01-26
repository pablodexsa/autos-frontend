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
    setRoles(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const normalizeRoleName = (s: string) => s.trim().toLowerCase();

  const handleSave = async () => {
    const normalized = normalizeRoleName(roleName);

    if (!normalized) {
      alert("Ingrese un nombre de rol válido.");
      return;
    }

    // ✅ Regla: los roles deben guardarse en minúscula para matchear permissions.ts
    // Ej: "legales"
    if (selectedRole) {
      await updateRole(selectedRole.id, normalized);
    } else {
      await createRole(normalized);
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
        <Typography variant="h5" sx={{ mb: 1 }}>
          Gestión de Roles
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.75)" }}>
          Nota: los roles se guardan en minúscula (por ejemplo: <b>legales</b>) para que coincidan con permissions.ts.
        </Typography>

        <Button
          variant="contained"
          sx={{ mb: 2 }}
          onClick={() => {
            setSelectedRole(null);
            setRoleName("");
            setModalOpen(true);
          }}
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
            helperText='Sugerencia: escribí "legales"'
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
