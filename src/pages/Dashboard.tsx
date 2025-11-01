import React, { useEffect, useState } from "react";
import api from "../api/api"; // ✅ cliente global centralizado
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

interface Purchase {
  id: number;
  purchasePrice: number;
}

interface Sale {
  id: number;
  salePrice: number;
}

const Dashboard: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // 🔹 Obtener compras y ventas
  useEffect(() => {
    api
      .get("/purchases")
      .then((res) => setPurchases(res.data))
      .catch((err) => console.error("Error cargando compras:", err));

    api
      .get("/sales")
      .then((res) => setSales(res.data))
      .catch((err) => console.error("Error cargando ventas:", err));
  }, []);

  const totalCompras = purchases.reduce(
    (sum, p) => sum + Number(p.purchasePrice || 0),
    0
  );
  const totalVentas = sales.reduce(
    (sum, s) => sum + Number(s.salePrice || 0),
    0
  );
  const gananciaNeta = totalVentas - totalCompras;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Total Compras */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ backgroundColor: "#388e3c", color: "white", borderRadius: 3 }}
          >
            <CardContent>
              <ShoppingCartIcon sx={{ fontSize: 40 }} />
              <Typography variant="h6">Total Compras</Typography>
              <Typography variant="h5">
                ${totalCompras.toLocaleString("es-AR")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Ventas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ backgroundColor: "#1976d2", color: "white", borderRadius: 3 }}
          >
            <CardContent>
              <MonetizationOnIcon sx={{ fontSize: 40 }} />
              <Typography variant="h6">Total Ventas</Typography>
              <Typography variant="h5">
                ${totalVentas.toLocaleString("es-AR")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Ganancia Neta */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: gananciaNeta >= 0 ? "#2e7d32" : "#d32f2f",
              color: "white",
              borderRadius: 3,
            }}
          >
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40 }} />
              <Typography variant="h6">Ganancia Neta</Typography>
              <Typography variant="h5">
                ${gananciaNeta.toLocaleString("es-AR")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cantidad de Operaciones */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ backgroundColor: "#f57c00", color: "white", borderRadius: 3 }}
          >
            <CardContent>
              <DirectionsCarIcon sx={{ fontSize: 40 }} />
              <Typography variant="h6">Vehículos Operados</Typography>
              <Typography variant="h5">
                {purchases.length + sales.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
