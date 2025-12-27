import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import api from "../../api/api";

type LoanType = "prendario" | "personal" | "financiacion";

type MatrixResponse = {
  types: LoanType[];
  months: number[];
  values: Record<LoanType, Record<number, number>>;
};

const labelType: Record<LoanType, string> = {
  prendario: "Préstamo prendario",
  personal: "Préstamo personal",
  financiacion: "Financiación propia",
};

export default function SettingsLoanRates() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MatrixResponse | null>(null);
  const [form, setForm] = useState<Record<LoanType, Record<number, string>> | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const types = useMemo(
    () => data?.types ?? (["prendario", "personal", "financiacion"] as LoanType[]),
    [data]
  );
  const months = useMemo(() => data?.months ?? [12, 24, 36], [data]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/settings/loan-rates");
        if (!mounted) return;

        const payload: MatrixResponse = res.data;
        setData(payload);

        const nextForm: any = {};
        for (const t of payload.types) {
          nextForm[t] = {};
          for (const m of payload.months) {
            nextForm[t][m] = String(payload.values[t]?.[m] ?? 0);
          }
        }
        setForm(nextForm);
      } catch {
        setToast({ type: "error", msg: "No se pudo cargar loan_rates." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (type: LoanType, m: number, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [type]: { ...prev[type], [m]: value } };
    });
  };

  const onSave = async () => {
    if (!form) return;

    const items: Array<{ type: LoanType; months: 12 | 24 | 36; rate: number }> = [];

    for (const t of types) {
      for (const m of months) {
        const raw = form[t]?.[m] ?? "0";
        const num = Number(String(raw).replace(",", "."));

        if (Number.isNaN(num) || num < 0) {
          setToast({ type: "error", msg: `Valor inválido en ${labelType[t]} (${m} cuotas).` });
          return;
        }

        items.push({
          type: t,
          months: m as 12 | 24 | 36,
          rate: Number(num.toFixed(2)),
        });
      }
    }

    try {
      setSaving(true);
      const res = await api.put("/settings/loan-rates", { items });

      const payload: MatrixResponse = res.data;
      setData(payload);

      const nextForm: any = {};
      for (const t of payload.types) {
        nextForm[t] = {};
        for (const m of payload.months) {
          nextForm[t][m] = String(payload.values[t]?.[m] ?? 0);
        }
      }
      setForm(nextForm);

      setToast({ type: "success", msg: "Porcentajes actualizados correctamente." });
    } catch {
      setToast({ type: "error", msg: "No se pudo guardar. Revisá logs del backend." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Porcentajes de financiación</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
          Editá los porcentajes por tipo y cuotas (12, 24, 36).
        </Typography>

        <Divider sx={{ my: 2 }} />

        {loading || !form ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando…</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {types.map((t) => (
              <Grid item xs={12} key={t}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {labelType[t]}
                  </Typography>

                  <Grid container spacing={2}>
                    {months.map((m) => (
                      <Grid item xs={12} sm={4} key={`${t}-${m}`}>
                        <TextField
                          fullWidth
                          label={`${m} cuotas (%)`}
                          value={form[t][m]}
                          onChange={(e) => onChange(t, m, e.target.value)}
                          inputProps={{ inputMode: "decimal" }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={onSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)}>
        {toast ? (
          <Alert severity={toast.type} onClose={() => setToast(null)} sx={{ width: "100%" }}>
            {toast.msg}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}
