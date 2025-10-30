import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00BFA5", // Verde agua moderno
    },
    secondary: {
      main: "#FFC107", // Amarillo suave para destacar botones secundarios
    },
    background: {
      default: "#121212",
      paper: "#1e1e2f", // Fondos de tarjetas
    },
    text: {
      primary: "#E0E0E0",
      secondary: "#B0B0B0",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h6: {
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
    body1: {
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          padding: "8px 16px",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.03)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e2f",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "#E0E0E0",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
  },
});

export default theme;
