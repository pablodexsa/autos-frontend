import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL;

export default function PublicKairosPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    cuitCuil: "",
    phone: "",
    businessAddress: "",
    businessType: "",
    businessAge: "",
    requestedAmount: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/kairos-leads/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            requestedAmount: Number(
              form.requestedAmount,
            ),
            campaign: "Landing Kairos",
            utmSource: "landing",
          }),
        },
      );

      if (!response.ok) {
        throw new Error();
      }

      setSuccess(true);
    } catch {
      alert(
        "No se pudo enviar la solicitud.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg,#0f172a,#1e293b)",
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            width: "100%",
          }}
        >
          <CardContent>
            <Typography
              variant="h4"
              gutterBottom
            >
              Solicitud enviada
            </Typography>

            <Typography>
              Gracias por completar tu
              solicitud.
            </Typography>

            <Typography sx={{ mt: 2 }}>
              Un asesor de Kairos se
              comunicará con vos.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b)",
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Typography
              variant="h3"
              align="center"
              gutterBottom
            >
              Kairos Capital
            </Typography>

            <Typography
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Solicitud de préstamo para
              comercios
            </Typography>

            <form
              onSubmit={handleSubmit}
            >
              <TextField
                fullWidth
                required
                margin="normal"
                label="Nombre y apellido"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                label="CUIT / CUIL"
                name="cuitCuil"
                value={form.cuitCuil}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                label="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                label="Dirección del comercio"
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                label="Rubro"
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                label="Antigüedad"
                name="businessAge"
                value={form.businessAge}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                margin="normal"
                type="number"
                label="Monto solicitado"
                name="requestedAmount"
                value={form.requestedAmount}
                onChange={handleChange}
              />

              <Button
                fullWidth
                type="submit"
                size="large"
                variant="contained"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading
                  ? "Enviando..."
                  : "Solicitar préstamo"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}