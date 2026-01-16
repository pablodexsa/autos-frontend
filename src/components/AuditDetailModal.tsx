import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
} from "@mui/material";

export default function AuditDetailModal({ open, onClose, log }: any) {
  if (!log) return null;

  const pretty = (obj: any) =>
    obj ? JSON.stringify(obj, null, 2) : "Sin información";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: "#1e1e2f", color: "#fff" }}>
        Detalles del Registro
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#2a2a40", color: "#fff" }}>
        <Box sx={{ mb: 2 }}>
          <Typography>
            <strong>Usuario:</strong> {log.user?.name || "N/A"}
          </Typography>
          <Typography>
            <strong>Acción:</strong> {log.action}
          </Typography>
          <Typography>
            <strong>Módulo:</strong> {log.module}
          </Typography>
          <Typography>
            <strong>IP:</strong> {log.ip}
          </Typography>
          <Typography>
            <strong>Fecha:</strong>{" "}
            {new Date(log.createdAt).toLocaleString("es-AR")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ color: "#00BFA5" }}>
          Payload (Body)
        </Typography>
        <Box
          sx={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 14,
            mb: 2,
          }}
        >
          {pretty(log.body)}
        </Box>

        <Typography variant="subtitle2" sx={{ color: "#00BFA5" }}>
          Query Params
        </Typography>
        <Box
          sx={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 14,
            mb: 2,
          }}
        >
          {pretty(log.query)}
        </Box>

        <Typography variant="subtitle2" sx={{ color: "#00BFA5" }}>
          Detalles Internos
        </Typography>
        <Box
          sx={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 14,
          }}
        >
          {pretty(log.details)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#1e1e2f" }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
