import React, { useEffect, useState } from "react";
import axios from "axios";
import { SaleForm } from "../components/SaleForm";
import { SaleTable } from "../components/SaleTable";

const Sales: React.FC = () => {
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // 📦 Cargar todas las ventas existentes
  const fetchSales = () => {
    axios
      .get("http://localhost:3000/api/sales")
      .then((res) => setSales(res.data))
      .catch((err) => {
        console.error("Error cargando ventas:", err);
        alert("No se pudieron cargar las ventas.");
      });
  };

  // 🚗 Cargar vehículos disponibles desde el backend (nuevo modelo 'vehicles')
  const fetchVehicles = () => {
    axios
      .get("http://localhost:3000/api/vehicles", {
        params: { status: "available", page: 1, limit: 1000 },
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.items || [];
        setVehicles(data);
      })
      .catch((err) => {
        console.error("Error cargando vehículos:", err);
        alert("No se pudieron cargar los vehículos disponibles.");
      });
  };

  // 🧭 Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchSales();
    fetchVehicles();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      {/* 🔹 Pasamos vehículos al formulario */}
      <SaleForm onSaleCreated={fetchSales} vehicles={vehicles} />
      <SaleTable sales={sales} />
    </div>
  );
};

export default Sales;
