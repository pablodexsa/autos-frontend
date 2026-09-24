import { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Grid, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import api from "../api/api";
import { treasuryApi } from "../api/treasury";
import type { TreasuryAccount, TreasuryPaymentMethod } from "../types/treasury";

type AcquisitionType = "DEALER_PURCHASE" | "PRIVATE_PURCHASE" | "TRADE_IN" | "CONSIGNMENT";
type AllocationRow = { accountId: string; amount: string; paymentMethod: TreasuryPaymentMethod };
type VehicleOption = { id: number; brand?: string; model?: string; year?: number; plate?: string; status?: string };
type ClientOption = { id: number; firstName?: string; lastName?: string; dni?: string };

const TYPE_LABELS: Record<AcquisitionType, string> = {
  DEALER_PURCHASE: "Compra a agencia / proveedor",
  PRIVATE_PURCHASE: "Compra a particular",
  TRADE_IN: "Recibido en parte de pago",
  CONSIGNMENT: "Consignado",
};

export function PurchaseForm({ onAdded }: { onAdded: () => void }) {
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>("DEALER_PURCHASE");
  const [vehicle, setVehicle] = useState<VehicleOption | null>(null);
  const [client, setClient] = useState<ClientOption | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [relatedSaleId, setRelatedSaleId] = useState("");
  const [amount, setAmount] = useState("");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allocations, setAllocations] = useState<AllocationRow[]>([{ accountId: "", amount: "", paymentMethod: "TRANSFER" }]);

  const requiresCashOut = acquisitionType === "DEALER_PURCHASE" || acquisitionType === "PRIVATE_PURCHASE";
  const requiresClient = acquisitionType !== "DEALER_PURCHASE";

  useEffect(() => {
    Promise.all([api.get("/vehicles", { params: { page: 1, limit: 200 } }), api.get("/clients"), treasuryApi.accounts("GL_MOTORS")])
      .then(([v, c, a]) => {
        setVehicles(Array.isArray(v.data) ? v.data : (v.data?.items ?? []));
        setClients(Array.isArray(c.data) ? c.data : (c.data?.items ?? []));
        setAccounts(a.filter((row) => row.isActive));
      })
      .catch(() => setError("No se pudieron cargar los datos necesarios para registrar la adquisición"));
  }, []);

  const purchaseAmount = Number(amount || 0);
  const allocatedAmount = useMemo(() => allocations.reduce((sum, row) => sum + Number(row.amount || 0), 0), [allocations]);
  const difference = purchaseAmount - allocatedAmount;
  const updateAllocation = (index: number, patch: Partial<AllocationRow>) => setAllocations((cur) => cur.map((r, i) => i === index ? { ...r, ...patch } : r));

  const reset = () => {
    setVehicle(null); setClient(null); setSupplierName(""); setRelatedSaleId(""); setAmount("");
    setAllocations([{ accountId: "", amount: "", paymentMethod: "TRANSFER" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!vehicle || purchaseAmount <= 0) return setError("Seleccioná el vehículo e indicá el valor de adquisición");
    if (requiresClient && !client) return setError("Seleccioná la persona/cliente de la operación");
    if (acquisitionType === "DEALER_PURCHASE" && !supplierName.trim()) return setError("Indicá la agencia/proveedor");
    if (acquisitionType === "TRADE_IN" && (!relatedSaleId || Number(relatedSaleId) <= 0)) return setError("Indicá el ID de la venta asociada a la parte de pago");
    if (requiresCashOut) {
      if (allocations.some((r) => !r.accountId || Number(r.amount) <= 0)) return setError("Completá todas las cuentas e importes de Tesorería");
      if (Math.abs(difference) > 0.01) return setError("La distribución entre cuentas debe coincidir con el valor total de compra");
    }
    try {
      setSaving(true);
      await api.post("/purchases", {
        vehicleId: vehicle.id, acquisitionType, amount: purchaseAmount,
        clientId: client?.id,
        supplierName: acquisitionType === "DEALER_PURCHASE" ? supplierName.trim() : undefined,
        relatedSaleId: acquisitionType === "TRADE_IN" ? Number(relatedSaleId) : undefined,
        treasuryAllocations: requiresCashOut ? allocations.map((r) => ({ accountId: Number(r.accountId), amount: Number(r.amount), paymentMethod: r.paymentMethod })) : [],
      });
      reset(); onAdded();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(". ") : msg || err?.response?.data?.mensaje || "Error al registrar adquisición");
    } finally { setSaving(false); }
  };

  return <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, mb: 2, borderRadius: 2, backgroundColor: "#1e1e2f", border: "1px solid rgba(255,255,255,0.08)" }}>
    <Typography variant="h6" sx={{ mb: 2 }}>Registrar adquisición de vehículo</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><TextField select fullWidth label="Tipo de adquisición" value={acquisitionType} onChange={(e) => { setAcquisitionType(e.target.value as AcquisitionType); setClient(null); setSupplierName(""); setRelatedSaleId(""); }}>
        {Object.entries(TYPE_LABELS).map(([value,label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
      </TextField></Grid>
      <Grid item xs={12} md={4}><Autocomplete options={vehicles} value={vehicle} onChange={(_,v)=>setVehicle(v)} getOptionLabel={(v)=>`${v.brand ?? ""} ${v.model ?? ""} ${v.year ?? ""} - ${v.plate ?? ""}`.trim()} renderInput={(p)=><TextField {...p} label="Vehículo" required />} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth type="number" label={requiresCashOut ? "Precio de compra" : "Valor de toma / valuación"} value={amount} onChange={(e)=>setAmount(e.target.value)} required /></Grid>

      {acquisitionType === "DEALER_PURCHASE" && <Grid item xs={12} md={6}><TextField fullWidth label="Agencia / proveedor" placeholder="Ej.: Randazzo, Radatti" value={supplierName} onChange={(e)=>setSupplierName(e.target.value)} required /></Grid>}
      {requiresClient && <Grid item xs={12} md={6}><Autocomplete options={clients} value={client} onChange={(_,v)=>setClient(v)} getOptionLabel={(c)=>`${c.firstName ?? ""} ${c.lastName ?? ""}${c.dni ? ` - DNI ${c.dni}` : ""}`.trim()} renderInput={(p)=><TextField {...p} label={acquisitionType === "CONSIGNMENT" ? "Propietario" : "Cliente / particular"} required />} /></Grid>}
      {acquisitionType === "TRADE_IN" && <Grid item xs={12} md={6}><TextField fullWidth type="number" label="ID de venta asociada" value={relatedSaleId} onChange={(e)=>setRelatedSaleId(e.target.value)} required /></Grid>}
    </Grid>

    {requiresCashOut ? <>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>¿Desde qué cuenta/s se pagó?</Typography>
      <Stack spacing={2}>{allocations.map((row,index)=><Grid container spacing={2} alignItems="center" key={index}>
        <Grid item xs={12} md={4}><TextField select fullWidth label="Cuenta GL" value={row.accountId} onChange={(e)=>updateAllocation(index,{accountId:e.target.value})}>{accounts.map(a=><MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Importe" value={row.amount} onChange={(e)=>updateAllocation(index,{amount:e.target.value})} /></Grid>
        <Grid item xs={10} md={4}><TextField select fullWidth label="Medio de pago" value={row.paymentMethod} onChange={(e)=>updateAllocation(index,{paymentMethod:e.target.value as TreasuryPaymentMethod})}>
          <MenuItem value="TRANSFER">Transferencia</MenuItem><MenuItem value="CASH">Efectivo</MenuItem><MenuItem value="WALLET">Billetera</MenuItem><MenuItem value="CHECK">Cheque</MenuItem><MenuItem value="DEBIT">Débito</MenuItem><MenuItem value="CREDIT">Crédito</MenuItem><MenuItem value="OTHER">Otro</MenuItem>
        </TextField></Grid>
        <Grid item xs={2} md={1}><IconButton onClick={()=>setAllocations(cur=>cur.length===1?cur:cur.filter((_,i)=>i!==index))} disabled={allocations.length===1}><DeleteOutlineIcon /></IconButton></Grid>
      </Grid>)}</Stack>
      <Stack direction="row" spacing={2} sx={{mt:2}} alignItems="center"><Button startIcon={<AddIcon />} onClick={()=>setAllocations(cur=>[...cur,{accountId:"",amount:"",paymentMethod:"TRANSFER"}])}>Agregar cuenta</Button><Typography variant="body2">Distribuido: $ {allocatedAmount.toLocaleString("es-AR")} / Total: $ {purchaseAmount.toLocaleString("es-AR")}</Typography></Stack>
    </> : <Alert severity="info" sx={{mt:3}}>{acquisitionType === "TRADE_IN" ? "La parte de pago aumenta el stock, pero no genera un egreso de Tesorería." : "La consignación no genera un egreso de Tesorería al ingresar el vehículo."}</Alert>}
    <Button sx={{mt:2}} type="submit" variant="contained" disabled={saving}>{saving ? "Registrando..." : "Registrar adquisición"}</Button>
  </Box>;
}
