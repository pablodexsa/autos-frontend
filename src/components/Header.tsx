import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(90deg, #1e1e2f, #0f0f1b)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* ?? Menú hamburguesa (visible en mobile) */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center" }}>
          <IconButton color="inherit" onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
        </Box>

        {/* ?? Logo y título */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ width: 40, height: 40, borderRadius: "8px" }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              display: { xs: "none", sm: "block" },
            }}
          >
            GL Motors
          </Typography>
        </Box>

        {/* ?? Usuario logueado + logout */}
        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Vista Desktop */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "#00bfa5",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                {userInitial}
              </Avatar>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#E0E0E0",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                }}
              >
                {user.name}
              </Typography>

              <Button
                onClick={logout}
                startIcon={<LogoutIcon />}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Cerrar sesión
              </Button>
            </Box>

            {/* Vista Mobile */}
            <Box sx={{ display: { xs: "flex", sm: "none" } }}>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#00bfa5",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {userInitial}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: "#1e1e2f",
                    color: "#fff",
                    borderRadius: 2,
                    mt: 1,
                  },
                }}
              >
                <MenuItem disabled>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      textTransform: "uppercase",
                    }}
                  >
                    {user.name}
                  </Typography>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    logout();
                  }}
                  sx={{
                    "&:hover": {
                      backgroundColor: "#00bfa5",
                      color: "#000",
                    },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1 }} /> Cerrar sesión
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
