export const permissions = {
  admin: [
    "home",
    "dashboard_gerencial",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
    "reservations",
    "reservation-list",
    "refunds",
    "sales",
    "sales-list",
    "installment-payments",
    "installments",
    "judicial-executions",
    "settings",
    "users",
    "roles",
    "audit",
  ],

owner: [
  "home",
  "dashboard_gerencial",
  "vehicles",
  "clients",
  "budgets",
  "budget-reports",
  "reservations",
  "reservation-list",
  "refunds",
  "sales",
  "sales-list",
  "installment-payments",
  "installments",
  "judicial-executions",
  "settings",
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
  ],

  gerencia: [
    "home",
    "vehicles",
    "clients",
    "budgets",
    "budget-reports",
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
    "dashboard_gerencial",
    "vehicles",
    "clients",
    "budget-reports",
    "reservation-list",
    "refunds",
    "sales-list",
    "installment-payments",
    "installments",
    "judicial-executions",
  ],

};