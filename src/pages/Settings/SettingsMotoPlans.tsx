import React, { useEffect, useState } from "react";
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
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../../api/api";

type MotoPlan = {
  code: string;
  name: string;
  installments: number;
  downPayment: number;
  totalInstallments: number;
  firstInstallmentsCount: number;
  firstInstallmentAmount: number;
  remainingInstallmentAmount: number;
};

export default function SettingsMotoPlans() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<MotoPlan[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/settings/moto-plans");
        if (!mounted) return;

        const data = Array.isArray(res.data) ? res.data : [];
        setPlans(
          data.map((p: any) => ({
            code: String(p.code ?? ""),
            name: String(p.name ?? ""),
            installments: Number(p.installments ?? 0),
            downPayment: Number(p.downPayment ?? 0),
            totalInstallments: Number(
              p.totalInstallments ?? p.installments ?? 0
            ),
            firstInstallmentsCount: Number(p.firstInstallmentsCount ?? 0),
            firstInstallmentAmount: Number(p.firstInstallmentAmount ?? 0),
            remainingInstallmentAmount: Number(
              p.remainingInstallmentAmount ?? 0
            ),
          }))
        );
      } catch (err) {
        console.error("Error cargando planes de motos:", err);
        setToast({
          type: "error",
          msg: "No se pudieron cargar los planes de motos.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePlan = (
    index: number,
    field: keyof MotoPlan,
    value: string | number
  ) => {
    setPlans((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]:
          field === "code" || field === "name"
            ? String(value)
            : Number(value || 0),
      };
      return next;
    });
  };

  const addPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        installments: 0,
        downPayment: 0,
        totalInstallments: 0,
        firstInstallmentsCount: 0,
        firstInstallmentAmount: 0,
        remainingInstallmentAmount: 0,
      },
    ]);
  };

  const removePlan = (index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    for (const p of plans) {
      if (!p.code.trim()) {
        setToast({
          type: "error",
          msg: "Todos los planes deben tener código.",
        });
        return;
      }

      if (!p.name.trim()) {
        setToast({
          type: "error",
          msg: "Todos los planes deben tener nombre.",
        });
        return;
      }

      if (p.totalInstallments <= 0) {
        setToast({
          type: "error",
          msg: `El plan ${p.name} debe tener cuotas totales mayores a 0.`,
        });
        return;
      }

      if (p.firstInstallmentsCount < 0) {
        setToast({
          type: "error",
          msg: `El plan ${p.name} tiene una cantidad inválida de cuotas iniciales.`,
        });
        return;
      }

      if (p.firstInstallmentsCount > p.totalInstallments) {
        setToast({
          type: "error",
          msg: `El plan ${p.name} no puede tener más cuotas iniciales que cuotas totales.`,
        });
        return;
      }

      if (
        p.downPayment < 0 ||
        p.firstInstallmentAmount < 0 ||
        p.remainingInstallmentAmount < 0
      ) {
        setToast({
          type: "error",
          msg: `El plan ${p.name} tiene importes inválidos.`,
        });
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        plans: plans.map((p) => ({
          code: p.code.trim(),
          name: p.name.trim(),
          installments: Number(p.totalInstallments || p.installments || 0),
          downPayment: Number(p.downPayment || 0),
          totalInstallments: Number(p.totalInstallments || p.installments || 0),
          firstInstallmentsCount: Number(p.firstInstallmentsCount || 0),
          firstInstallmentAmount: Number(p.firstInstallmentAmount || 0),
          remainingInstallmentAmount: Number(p.remainingInstallmentAmount || 0),
        })),
      };

      const res = await api.patch("/settings/moto-plans", payload);

      const saved = Array.isArray(res.data?.plans) ? res.data.plans : [];
      setPlans(
        saved.map((p: any) => ({
          code: String(p.code ?? ""),
          name: String(p.name ?? ""),
          installments: Number(p.installments ?? 0),
          downPayment: Number(p.downPayment ?? 0),
          totalInstallments: Number(
            p.totalInstallments ?? p.installments ?? 0
          ),
          firstInstallmentsCount: Number(p.firstInstallmentsCount ?? 0),
          firstInstallmentAmount: Number(p.firstInstallmentAmount ?? 0),
          remainingInstallmentAmount: Number(
            p.remainingInstallmentAmount ?? 0
          ),
        }))
      );

      setToast({
        type: "success",
        msg: "Planes de motos guardados correctamente.",
      });
    } catch (err) {
      console.error("Error guardando planes de motos:", err);
      setToast({
        type: "error",
        msg: "No se pudieron guardar los planes de motos.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Planes de Motos</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
          Configurá anticipo, cuotas y valores de cada plan.
        </Typography>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando…</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {plans.map((plan, index) => (
                <Grid item xs={12} key={`${plan.code}-${index}`}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {plan.name || `Plan ${index + 1}`}
                      </Typography>

                      <IconButton
                        color="error"
                        onClick={() => removePlan(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Código"
                          value={plan.code}
                          onChange={(e) =>
                            updatePlan(index, "code", e.target.value.toUpperCase())
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="Nombre"
                          value={plan.name}
                          onChange={(e) =>
                            updatePlan(index, "name", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Anticipo"
                          value={plan.downPayment}
                          onChange={(e) =>
                            updatePlan(index, "downPayment", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cuotas totales"
                          value={plan.totalInstallments}
                          onChange={(e) =>
                            updatePlan(index, "totalInstallments", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cuotas iniciales"
                          value={plan.firstInstallmentsCount}
                          onChange={(e) =>
                            updatePlan(
                              index,
                              "firstInstallmentsCount",
                              e.target.value
                            )
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Valor cuota inicial"
                          value={plan.firstInstallmentAmount}
                          onChange={(e) =>
                            updatePlan(
                              index,
                              "firstInstallmentAmount",
                              e.target.value
                            )
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Valor cuotas restantes"
                          value={plan.remainingInstallmentAmount}
                          onChange={(e) =>
                            updatePlan(
                              index,
                              "remainingInstallmentAmount",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: "flex", gap: 2, mt: 2, justifyContent: "space-between" }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addPlan}>
                Agregar plan
              </Button>

              <Button variant="contained" onClick={onSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
      >
        {toast ? (
          <Alert
            severity={toast.type}
            onClose={() => setToast(null)}
            sx={{ width: "100%" }}
          >
            {toast.msg}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}