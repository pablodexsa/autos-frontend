import api from "./api";

export async function listReservations() {
  const { data } = await api.get("/reservations");
  return data;
}

export async function getReservationPdf(id: number) {
  const { data } = await api.get(`/reservations/${id}/pdf`);
  return data; // { url }
}

export async function createReservation(payload: {
  clientId: number;
  vehicleId: number;
  sellerId?: number;
  amount?: number;
}) {
  const { data } = await api.post("/reservations", payload);
  return data;
}

export async function addGuarantor(
  reservationId: number,
  body: {
    firstName: string;
    lastName: string;
    dni: string;
    address: string;
    phone: string;
  },
  files?: { dniCopy?: File | null; paystub?: File | null }
) {
  const form = new FormData();
  form.append("firstName", body.firstName);
  form.append("lastName", body.lastName);
  form.append("dni", body.dni);
  form.append("address", body.address);
  form.append("phone", body.phone);
  if (files?.dniCopy) form.append("dniCopy", files.dniCopy);
  if (files?.paystub) form.append("paystub", files.paystub);

  const { data } = await api.post(`/reservations/${reservationId}/guarantors`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateReservationStatus(id: number, status: "Aceptada" | "Cancelada") {
  const { data } = await api.patch(`/reservations/${id}/status`, { status });
  return data;
}
