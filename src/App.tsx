import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, Toolbar } from "@mui/material";
import { SnackbarProvider } from "notistack";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import Vehicles from "./pages/Vehicles";
import Clients from "./pages/Clients";
import RolesPage from "./pages/RolesPage";
import Budgets from "./pages/Budgets";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import theme from "./theme";
import Home from "./pages/Home";
import logo from "./assets/logo.jpeg";
import "./styles/global.css";
import Users from "./pages/Users";
import NotificationProvider from "./context/NotificationProvider";
import InstallmentPayments from "./pages/InstallmentPayments";
import Installments from "./pages/Installments";
import BudgetReports from "./pages/BudgetReports";
import ReservationsPage from "./pages/ReservationsPage";
import ReservationListPage from "./pages/ReservationListPage";


/**
 * Layout principal del sistema
 * Renderiza el Header y Sidebar solo si no estamos en /login
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // Oculta el menú y header en login
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f0f1b 0%, #1b1b2f 100%)",
        }}
      >
        <Toolbar />
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
              <MainLayout>
                <Routes>
                  {/* RUTA PÚBLICA */}
                  <Route path="/login" element={<Login />} />

                  {/* RUTAS PROTEGIDAS */}
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roles"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <RolesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/reservations" element={<ReservationsPage />} />
		  <Route path="/reservation-list" element={<ReservationListPage />} />
		  <Route path="/reservations/edit/:id" element={<ReservationsPage />} />			    <Route
                    path="/sales"
                    element={
                      <ProtectedRoute>
                        <Sales />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/installment-payments"
                    element={
                      <ProtectedRoute>
                        <InstallmentPayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/installments"
                    element={
                      <ProtectedRoute>
                        <Installments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/vehicles"
                    element={
                      <ProtectedRoute>
                        <Vehicles />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/clients"
                    element={
                      <ProtectedRoute>
                        <Clients />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRoute>
                        <Budgets />
                      </ProtectedRoute>
                    }
                  />
		  <Route path="/budget-reports" element={<BudgetReports />} /> {/* 👈 agregada */}
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* Página de inicio */}
                  <Route
                    path="/"
                    element={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "80vh",
                          color: "#E0E0E0",
                          flexDirection: "column",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          component="img"
                          src={logo}
                          alt="De Grazia Automotores"
                          sx={{
                            width: 200,
                            mb: 3,
                            borderRadius: 2,
                            animation: "shine 3s infinite linear",
                            "@keyframes shine": {
                              "0%": { filter: "brightness(1)" },
                              "50%": { filter: "brightness(1.8)" },
                              "100%": { filter: "brightness(1)" },
                            },
                          }}
                        />
                        <h1>Bienvenido a De Grazia Automotores</h1>
                        <p>Gestione sus ventas, clientes y presupuestos fácilmente.</p>
                      </Box>
                    }
                  />
                </Routes>
              </MainLayout>
            </SnackbarProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
