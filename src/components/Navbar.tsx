import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          De Grazia Automotores
        </Typography>
        <Button color="inherit" component={RouterLink} to="/">
          Inicio
        </Button>
        <Button color="inherit" component={RouterLink} to="/vehicles">
          Inventario
        </Button>
        <Button color="inherit" component={RouterLink} to="/purchases">
          Compras
        </Button>
        <Button color="inherit" component={RouterLink} to="/sales">
          Ventas
        </Button>
      </Toolbar>
    </AppBar>
  );
}
