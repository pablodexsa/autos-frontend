import { http } from "./http";

export async function getReservationAmount() {
  const { data } = await http.get("/settings/reservations/amount");
  return data.amount as number;
}

export async function setReservationAmount(amount: number) {
  const { data } = await http.patch("/settings/reservations/amount", { amount });
  return data.amount as number;
}
