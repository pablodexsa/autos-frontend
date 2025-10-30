import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import axios from "axios";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  dni: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: "",
    dni: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchClients = () => {
    axios
      .get("http://localhost:3000/api/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error("Error cargando clientes:", err));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.dni) {
      alert("El nombre, apellido y DNI son obligatorios.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:3000/api/clients/${editingId}`,
          form,
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        await axios.post("http://localhost:3000/api/clients", form, {
          headers: { "Content-Type": "application/json" },
        });
      }

      setForm({
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
        email: "",
        dni: "",
      });
      setEditingId(null);
      fetchClients();
    } catch (err) {
      console.error("Error guardando cliente:", err);
      alert("Error al guardar el cliente.");
    }
  };

  const handleEdit = (client: Client) => {
    setForm(client);
    setEditingId(client.id);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Paper
        elevation={4}
        sx={{ p: 4, borderRadius: 3, maxWidth: 800, margin: "auto" }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          {editingId ? "Editar Cliente" : "Registrar Cliente"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Nombre"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Apellido"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="DNI"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} textAlign="center">
              <Button type="submit" variant="contained" color="primary">
                {editingId ? "Guardar Cambios" : "Agregar Cliente"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Clientes Registrados
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary" }}>
                <TableCell>
                  <b>Nombre y Apellido</b>
                </TableCell>
                <TableCell>
                  <b>DNI</b>
                </TableCell>
                <TableCell>
                  <b>Teléfono</b>
                </TableCell>
                <TableCell>
                  <b>Email</b>
                </TableCell>
                <TableCell>
                  <b>Dirección</b>
                </TableCell>
                <TableCell>
                  <b>Acción</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    {c.firstName} {c.lastName}
                  </TableCell>
                  <TableCell>{c.dni}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.address}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEdit(c)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default Clients;
