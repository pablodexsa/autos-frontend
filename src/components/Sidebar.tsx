import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentsIcon from "@mui/icons-material/Payments";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonIcon from "@mui/icons-material/Person";
import PaidIcon from "@mui/icons-material/Paid"; // ✅ Devoluciones
import { useNavigate, useLocation } from "react-router-dom";
import { permissions } from "../permissions";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen?: boolean;
  handleDrawerToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 🔐 Rol normalizado
  const role =
    typeof user?.role === "string"
      ? user.role.toLowerCase()
      : user?.role?.name?.toLowerCase() || "";

  const allowedKeys = permissions[role] || [];

  const menuItems = [
    { text: "Vehículos", icon: <DirectionsCarIcon />, path: "/vehicles", key: "vehicles" },
    { text: "Clientes", icon: <PeopleIcon />, path: "/clients", key: "clients" },
    { text: "Generar Presupuesto", icon: <DescriptionIcon />, path: "/budgets", key: "budgets" },
    { text: "Listado de Presupuestos", icon: <DescriptionIcon />, path: "/budget-reports", key: "budget-reports" },
    { text: "Reservas", icon: <EventAvailableIcon />, path: "/reservations", key: "reservations" },
    { text: "Listado de Reservas", icon: <ListAltIcon />, path: "/reservation-list", key: "reservation-list" },

    // 💰 Devoluciones
    { text: "Devoluciones", icon: <PaidIcon />, path: "/refunds", key: "refunds" },

    { text: "Ventas", icon: <AttachMoneyIcon />, path: "/sales", key: "sales" },
    { text: "Listado de Ventas", icon: <ListAltIcon />, path: "/sales/list", key: "sales-list" },
    { text: "Cuotas", icon: <ListAltIcon />, path: "/installments", key: "installments" },
    { text: "Pago de Cuotas", icon: <PaymentsIcon />, path: "/installment-payments", key: "installment-payments" },
    { text: "Configuración", icon: <SettingsIcon />, path: "/settings", key: "settings" },
    { text: "Auditoría del Sistema", icon: <ListAltIcon />, path: "/audit", key: "audit" },
    { text: "Usuarios", icon: <PersonIcon />, path: "/users", key: "users" },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "#1e1e2f",
        color: "white",
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <Toolbar sx={{ justifyContent: "center", borderBottom: "1px solid #333" }}>
        <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
          GL Motors
        </Typography>
      </Toolbar>

      <Box sx={{ overflow: "auto", mt: 2 }}>
        <List>
          {menuItems
            .filter((item) => allowedKeys.includes(item.key))
            .map((item) => (
              <ListItemButton
                key={item.key}
                onClick={() => {
                  navigate(item.path);
                  handleDrawerToggle?.();
                }}
                sx={{
                  backgroundColor: location.pathname === item.path ? "#00BFA5" : "transparent",
                  color: location.pathname === item.path ? "#fff" : "rgba(255,255,255,0.8)",
                  "&:hover": {
                    backgroundColor: location.pathname === item.path ? "#00d9b8" : "#2a2a3b",
                  },
                  borderRadius: "8px",
                  mx: 1,
                  mb: 1,
                  transition: "0.3s",
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#1e1e2f",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle ?? (() => {})}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#1e1e2f",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
