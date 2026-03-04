export function formatDateAR(dateStr?: string | null): string {
  if (!dateStr) return "";

  const str = String(dateStr);

  // si viene ISO: 2026-05-05T00:00:00.000Z
  const dateOnly = str.includes("T") ? str.split("T")[0] : str;

  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateOnly;

  const [year, month, day] = parts;

  if (!year || !month || !day) return dateOnly;

  return `${day}/${month}/${year}`;
}