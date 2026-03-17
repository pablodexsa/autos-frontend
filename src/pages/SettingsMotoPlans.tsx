import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";

type MotoPlan = {
  code: string;
  name: string;
  installments: number;
};

export default function SettingsMotoPlans() {
  const [plans, setPlans] = useState<MotoPlan[]>([]);

  useEffect(() => {
    api.get("/settings/moto-plans").then((res) => {
      setPlans(res.data);
    });
  }, []);

  const updatePlan = (index: number, field: string, value: any) => {
    const updated = [...plans];
    (updated[index] as any)[field] = value;
    setPlans(updated);
  };

  const addPlan = () => {
    setPlans([
      ...plans,
      { code: "", name: "", installments: 12 },
    ]);
  };

  const removePlan = (index: number) => {
    const updated = plans.filter((_, i) => i !== index);
    setPlans(updated);
  };

  const save = async () => {
    await api.patch("/settings/moto-plans", { plans });
    alert("Planes guardados");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Planes de Motos
      </Typography>

      <Paper sx={{ p: 3 }}>
        {plans.map((plan, i) => (
          <Box
            key={i}
            display="grid"
            gridTemplateColumns="1fr 2fr 1fr auto"
            gap={2}
            mb={2}
          >
            <TextField
              label="Código"
              value={plan.code}
              onChange={(e) =>
                updatePlan(i, "code", e.target.value)
              }
            />

            <TextField
              label="Nombre"
              value={plan.name}
              onChange={(e) =>
                updatePlan(i, "name", e.target.value)
              }
            />

            <TextField
              label="Cuotas"
              type="number"
              value={plan.installments}
              onChange={(e) =>
                updatePlan(i, "installments", Number(e.target.value))
              }
            />

            <IconButton onClick={() => removePlan(i)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Button onClick={addPlan}>Agregar plan</Button>

        <Box mt={2}>
          <Button variant="contained" onClick={save}>
            Guardar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}