// src/pages/Clients.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/api";
import "./Vehicles.css";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  dni: string;
  dniPath?: string | null; // ✅ si el backend lo devuelve
}

type ClientFilters = {
  q?: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type PaginationState = {
  page: number;
  limit: number;
};

const initialFilters: ClientFilters = {
  q: "",
  dni: "",
  email: "",
  phone: "",
  address: "",
};

const initialPagination: PaginationState = {
  page: 1,
  limit: 10,
};

export default function ClientsPage() {
  // ======= DATA =======
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======= FILTROS (draft + applied) =======
  const [filtersDraft, setFiltersDraft] =
    useState<ClientFilters>(initialFilters);
  const [filters, setFilters] = useState<ClientFilters>(initialFilters);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // ======= PAGINACIÓN =======
  const [pagination, setPagination] =
    useState<PaginationState>(initialPagination);

  // ======= MODAL / FORM =======
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    address: "",
  });

  // ✅ Adjuntar DNI
  const [dniFile, setDniFile] = useState<File | null>(null);

  // Para confirmación al cancelar si hubo cambios
  const formSnapshotRef = useRef<string>("");

  const snapshotForm = (data: typeof form, file: File | null) =>
    JSON.stringify({ ...data, fileName: file?.name || null });

  // ======= FETCH =======
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/clients");
      setClients(data || []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // ======= FILTRADO EN FRONTEND =======
  const filteredClients = useMemo(() => {
    const q = (filters.q || "").trim().toLowerCase();
    const dni = (filters.dni || "").trim().toLowerCase();
    const email = (filters.email || "").trim().toLowerCase();
    const phone = (filters.phone || "").trim().toLowerCase();
    const address = (filters.address || "").trim().toLowerCase();

    return clients.filter((c) => {
      const fullName = `${c.firstName || ""} ${c.lastName || ""}`
        .trim()
        .toLowerCase();
      const cDni = (c.dni || "").toLowerCase();
      const cEmail = (c.email || "").toLowerCase();
      const cPhone = (c.phone || "").toLowerCase();
      const cAddress = (c.address || "").toLowerCase();

      if (q) {
        const hit =
          fullName.includes(q) ||
          cDni.includes(q) ||
          cEmail.includes(q) ||
          cPhone.includes(q) ||
          cAddress.includes(q);
        if (!hit) return false;
      }

      if (dni && !cDni.includes(dni)) return false;
      if (email && !cEmail.includes(email)) return false;
      if (phone && !cPhone.includes(phone)) return false;
      if (address && !cAddress.includes(address)) return false;

      return true;
    });
  }, [clients, filters]);

  // ======= PAGINACIÓN (client-side) =======
  const total = filteredClients.length;

  const totalPages = useMemo(() => {
    const pages = Math.ceil(total / (pagination.limit || 10));
    return pages > 0 ? pages : 1;
  }, [total, pagination.limit]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  // Si cambia el total o limit y la page queda afuera, la corregimos
  useEffect(() => {
    setPagination((p) => {
      const safePage = Math.min(Math.max(1, p.page), totalPages);
      if (safePage !== p.page) return { ...p, page: safePage };
      return p;
    });
  }, [totalPages]);

  const paginatedClients = useMemo(() => {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredClients.slice(start, end);
  }, [filteredClients, pagination.page, pagination.limit]);

  // ======= HELPERS =======
  const setDraftField = (name: keyof ClientFilters, value: any) =>
    setFiltersDraft((prev) => ({ ...prev, [name]: value ?? "" }));

  const applyFilters = () => {
    setFilters({ ...filtersDraft });
    setPagination((p) => ({ ...p, page: 1 })); // ✅ reset page al buscar
  };

  const clearFilters = () => {
    setFiltersDraft(initialFilters);
    setFilters(initialFilters);
    setShowMoreFilters(false);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const setPage = (page: number) => setPagination((p) => ({ ...p, page }));
  const setLimit = (limit: number) => setPagination({ page: 1, limit });

  // ======= DOWNLOAD DNI =======
  const handleDownloadDni = async (clientId: number) => {
    try {
      const resp = await api.get(`/clients/${clientId}/dni`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(resp.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert("Tu sesión expiró. Volvé a iniciar sesión.");
      } else if (err?.response?.status === 404) {
        alert("No se encontró DNI adjunto para este cliente.");
      } else {
        alert("Error al descargar el DNI.");
      }
      console.error("Error descargando DNI:", err);
    }
  };

  // ======= MODAL: NUEVO =======
  const handleOpenNewClientModal = () => {
    setEditing(null);
    const fresh = {
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      email: "",
      address: "",
    };
    setForm(fresh);
    setDniFile(null);
    formSnapshotRef.current = snapshotForm(fresh, null);
    setShowForm(true);
  };

  // ======= MODAL: EDITAR =======
  const handleOpenEditClientModal = (c: Client) => {
    setEditing(c);
    const mapped = {
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      dni: c.dni || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
    };
    setForm(mapped);
    setDniFile(null);
    formSnapshotRef.current = snapshotForm(mapped, null);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    const currentSnap = snapshotForm(form, dniFile);
    const originalSnap = formSnapshotRef.current;

    // ✅ Confirmación al cancelar si hay cambios
    if (currentSnap !== originalSnap) {
      const ok = window.confirm(
        "Tenés cambios sin guardar. ¿Cerrar igualmente?"
      );
      if (!ok) return;
    }

    setShowForm(false);
    setEditing(null);
    setDniFile(null);
  };

  // ======= SUBMIT =======
  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    // ✅ Todos los campos requeridos
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.dni.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.address.trim()
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // ✅ DNI adjunto obligatorio:
    // - Creación: siempre
    // - Edición: si no adjunta nuevo, debe existir uno previo (dniPath)
    const existingDniPath = Boolean((editing as any)?.dniPath);
    if (!editing && !dniFile) {
      alert("Debés adjuntar el DNI del cliente.");
      return;
    }
    if (editing && !dniFile && !existingDniPath) {
      alert("El cliente no tiene DNI adjunto. Debés adjuntar uno.");
      return;
    }

    // ✅ Confirmación antes de guardar
    const confirmMsg = editing
      ? "¿Guardar los cambios del cliente?"
      : "¿Crear el cliente?";
    if (!window.confirm(confirmMsg)) return;

    try {
      let saved: any;

      if (editing) {
        const resp = await api.put(`/clients/${editing.id}`, form, {
          headers: { "Content-Type": "application/json" },
        });
        saved = resp.data;
      } else {
        const resp = await api.post("/clients", form, {
          headers: { "Content-Type": "application/json" },
        });
        saved = resp.data;
      }

      // ✅ Subida DNI adjunto (si hay archivo)
      if (dniFile && saved?.id) {
        try {
          const fd = new FormData();
          fd.append("file", dniFile);
          await api.post(`/clients/${saved.id}/dni`, fd);
        } catch (err) {
          console.error("Error subiendo DNI:", err);
          alert(
            "El cliente se guardó, pero hubo un error al subir el DNI adjunto."
          );
        }
      }

      setShowForm(false);
      setEditing(null);
      setDniFile(null);

      await fetchClients();
    } catch (err: any) {
      console.error("Error guardando cliente:", err);
      alert(err?.response?.data?.message || "Error al guardar el cliente.");
    }
  };

  // ======= RENDER =======
  return (
    <div className="vehicles-container">
      <h1>Clientes</h1>

      {/* FILTROS PRINCIPALES */}
      <div className="filters-main" style={{ flexWrap: "wrap" }}>
        <input
          placeholder="Buscar (nombre, email, DNI...)"
          value={filtersDraft.q || ""}
          onChange={(e) => setDraftField("q", e.target.value)}
        />
        <input
          placeholder="DNI"
          value={filtersDraft.dni || ""}
          onChange={(e) => setDraftField("dni", e.target.value)}
        />
        <input
          placeholder="Email"
          value={filtersDraft.email || ""}
          onChange={(e) => setDraftField("email", e.target.value)}
        />

        <button
          className="btn-secondary"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
        >
          {showMoreFilters ? "Ocultar filtros" : "Más filtros"}
        </button>
        <button className="btn-secondary" onClick={clearFilters}>
          Limpiar
        </button>
        <button className="btn-primary" onClick={applyFilters}>
          Buscar
        </button>
      </div>

      {showMoreFilters && (
        <div className="filters-more">
          <input
            placeholder="Teléfono"
            value={filtersDraft.phone || ""}
            onChange={(e) => setDraftField("phone", e.target.value)}
          />
          <input
            placeholder="Dirección"
            value={filtersDraft.address || ""}
            onChange={(e) => setDraftField("address", e.target.value)}
          />
        </div>
      )}

      {/* ACCIONES */}
      <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={handleOpenNewClientModal}>
          Nuevo cliente
        </button>
        <button
          className="btn-secondary"
          onClick={fetchClients}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Nombre y Apellido</th>
              <th>DNI</th>
              <th>DNI adjunto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedClients.map((c) => {
              const hasDni = Boolean((c as any).dniPath);

              return (
                <tr key={c.id}>
                  <td>
                    {(c.firstName || "").trim()} {(c.lastName || "").trim()}
                  </td>
                  <td>{c.dni}</td>

                  <td>
                    {hasDni ? (
                      <button
                        className="btn-secondary"
                        onClick={() => handleDownloadDni(c.id)}
                      >
                        Descargar
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{c.phone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.address || "—"}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenEditClientModal(c)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}

            {paginatedClients.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* PAGINACIÓN (como Vehículos) */}
      <div className="pagination">
        <span>Resultados: {total}</span>

        <select
          value={pagination.limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {pages.map((p) => (
            <button
              key={p}
              disabled={p === pagination.page}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar cliente" : "Nuevo cliente"}</h3>

            <form onSubmit={onSubmit}>
              <input
                name="firstName"
                placeholder="Nombre"
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
                required
              />
              <input
                name="lastName"
                placeholder="Apellido"
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
                required
              />
              <input
                name="dni"
                placeholder="DNI"
                value={form.dni}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dni: e.target.value }))
                }
                required
              />
              <input
                name="phone"
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                required
              />
              <input
                name="email"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
              <input
                name="address"
                placeholder="Dirección"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                required
              />

              {/* ✅ Adjuntar DNI */}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Adjuntar DNI (PDF / imagen)
                </label>
                <input
                  type="file"
                  onChange={(e) => setDniFile(e.target.files?.[0] || null)}
                  // ✅ requerido al crear; en edición solo si no existe uno previo
                  required={!editing || (!dniFile && !Boolean((editing as any)?.dniPath))}
                />
                {dniFile && (
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    Archivo seleccionado: <b>{dniFile.name}</b>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>

            {/* ✅ Si estás editando y ya existe DNI adjunto, ofrezco descargarlo */}
            {editing && Boolean((editing as any).dniPath) && (
              <div style={{ marginTop: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleDownloadDni(editing.id)}
                >
                  Descargar DNI actual
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
