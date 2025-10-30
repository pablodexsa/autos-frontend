import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export default function UserDeleteDialog({ open, onClose, onConfirm, user }: any) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Eliminar Usuario</DialogTitle>
      <DialogContent dividers>
        <Typography>
          ¿Seguro que deseas eliminar a <strong>{user?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
