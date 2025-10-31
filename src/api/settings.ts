import api from "./api";

export async function getReservationAmount() {
  const { data } = await api.get("/settings/reservations/amount");
  return data.amount as number;
}

export async function setReservationAmount(amount: number) {
  const { data } = await api.patch("/settings/reservations/amount", { amount });
  return data.amount as number;
}
