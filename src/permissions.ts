export const permissions = {
  admin: [
    "home",
    "dashboard_gerencial",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "directo",
    "reservations",
    "reservation-list",
    "refunds",
    "sales",
    "sales-list",
    "installment-payments",
    "installments",
    "settings",
    "users",
    "roles",
    "audit",
  ],

  vendedor: [
    "home",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "reservations",
    "reservation-list",
    "sales",
  ],

  // ✅ NUEVO: vendedor de motos (mismo acceso funcional que vendedor, pero backend filtra motos)
  vendedor_motos: [
    "home",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "reservations",
    "reservation-list",
    "sales",
  ],

  // ✅ NUEVO: vendedor de autos (mismo acceso funcional que vendedor, pero backend filtra motos)
  vendedor_autos: [
    "home",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "reservations",
    "reservation-list",
    "sales",
  ],

  preventa_motos: [
    "home",
    "directo",
  ],

  gerencia: [
    "home",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "directo",
    "reservations",
    "reservation-list",
    "refunds",
    "sales",
    "sales-list",
    "settings",
  ],

  viewer: [
    "home",
    "vehicles",
  ],

  legales: [
    "home",
    "vehicles",
    "clients",
    "budget-reports",
    "reservation-list",
    "refunds",
    "sales-list",
    "installment-payments",
    "installments",
  ],
};