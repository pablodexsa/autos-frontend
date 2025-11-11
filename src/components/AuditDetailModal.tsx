import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";

export default function AuditDetailModal({ open, onClose, log }: any) {
  if (!log) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalles del Registro</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 14 }}>
          {JSON.stringify(log.details, null, 2)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
