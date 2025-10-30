import { useEffect, useState } from "react";
import { api } from "../api";
import { PurchaseForm } from "../components/PurchaseForm";
import { PurchaseTable } from "../components/PurchaseTable";

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);

  const load = () => {
    api.get("/purchases").then(res => setPurchases(res.data));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Compras</h1>
      <PurchaseForm onAdded={load} />
      <PurchaseTable purchases={purchases} />
    </div>
  );
}
