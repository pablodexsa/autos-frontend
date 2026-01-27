// src/pages/Vehicles.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Vehicle } from "../types/vehicle";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  VehicleQuery,
} from "../api/vehicles";
import { listBrands, createBrand } from "../api/brands";
import { listModels, createModel } from "../api/models";
import { listVersions, createVersion } from "../api/versions";
import { Brand, Model, Version } from "../types/catalog";
import "./Vehicles.css";
import { API_URL } from "../config";
import api from "../api/api"; // para SSE y documentación
import { useAuth } from "../context/AuthContext"; // ✅ NUEVO (permisos)

const initialQuery: VehicleQuery = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

const PROCEDENCIAS = ["Randazzo", "Radatti", "Consignados", "Propios"] as const;
const CONCESIONARIAS = ["DG", "SyS"] as const;

export default function VehiclesPage() {
  // ✅ PERMISOS
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("VEHICLE_CREATE");
  const canEdit = hasPermission("VEHICLE_EDIT");
  const canDelete = hasPermission("VEHICLE_DELETE");

  // ======= ESTADO GENERAL =======
  const [query, setQuery] = useState<VehicleQuery>(initialQuery);
  const [data, setData] = useState<{
    items: Vehicle[];
    total: number;
    totalPages: number;
  }>({
    items: [],
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======= CATÁLOGOS (FILTROS) =======
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  // ======= UI =======
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // ======= CARGAS INICIALES (FILTROS) =======
  useEffect(() => {
    (async () => {
      try {
        const bs = await listBrands();
        setBrands(bs);
      } catch (err) {
        console.error("Error al cargar marcas:", err);
      }
    })();
  }, []);

  // Dependencia modelos según marca en filtros
  useEffect(() => {
    (async () => {
      if (query.brandId) {
        const ms = await listModels(query.brandId);
        setModels(ms);
      } else {
        setModels([]);
      }
      setVersions([]);
      setQuery((q) => ({ ...q, modelId: undefined, versionId: undefined }));
    })();
  }, [query.brandId]);

  // Dependencia versiones según modelo en filtros
  useEffect(() => {
    (async () => {
      if (query.modelId) {
        const vs = await listVersions(query.modelId);
        setVersions(vs);
      } else {
        setVersions([]);
      }
      setQuery((q) => ({ ...q, versionId: undefined }));
    })();
  }, [query.modelId]);

  // ======= LISTADO =======
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listVehicles(query);
      setData({
        items: res.items,
        total: res.total,
        totalPages: res.totalPages,
      });
    } catch (e: any) {
      setError(e?.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  // ======= STREAM REALTIME (SSE) =======
  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    const es = new EventSource(`${API_URL}/vehicles/stream`, {
      withCredentials: false,
    });
    es.onmessage = () => fetchData();
    es.onerror = (err) => console.warn("❌ Error SSE:", err);
    esRef.current = es;
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= HELPERS =======
  const setField = (name: keyof VehicleQuery, value: any) =>
    setQuery((q) => ({ ...q, page: 1, [name]: value ?? undefined }));

  const clearFilters = () => {
    setModels([]);
    setVersions([]);
    setQuery(initialQuery);
  };

  const pages = useMemo(
    () => Array.from({ length: data.totalPages || 1 }, (_, i) => i + 1),
    [data.totalPages]
  );

  // ======= FORMULARIO (CATÁLOGOS) =======
  const [formBrands, setFormBrands] = useState<Brand[]>([]);
  const [formModels, setFormModels] = useState<Model[]>([]);
  const [formVersions, setFormVersions] = useState<Version[]>([]);
  const [formBrandId, setFormBrandId] = useState<number | undefined>(undefined);
  const [formModelId, setFormModelId] = useState<number | undefined>(undefined);
  const [formVersionId, setFormVersionId] = useState<number | undefined>(
    undefined
  );

  // 📁 archivo de documentación
  const [docFile, setDocFile] = useState<File | null>(null);

  // Cargar catálogos para el formulario
  useEffect(() => {
    (async () => {
      const bs = await listBrands();
      setFormBrands(bs);
    })();
  }, []);

  // Cargar modelos según marca en el formulario
  useEffect(() => {
    (async () => {
      if (!formBrandId) {
        setFormModels([]);
        setFormModelId(undefined);
        setFormVersions([]);
        setFormVersionId(undefined);
        return;
      }
      const ms = await listModels(formBrandId);
      setFormModels(ms);
    })();
  }, [formBrandId]);

  // Cargar versiones según modelo en el formulario
  useEffect(() => {
    (async () => {
      if (!formModelId) {
        setFormVersions([]);
        setFormVersionId(undefined);
        return;
      }
      const vs = await listVersions(formModelId);
      setFormVersions(vs);
    })();
  }, [formModelId]);

  // ======= NUEVAS OPCIONES DE CATÁLOGO =======
  const handleAddBrand = async () => {
    const name = prompt("Ingrese el nombre de la nueva marca:");
    if (!name?.trim()) return;
    try {
      const newBrand = await createBrand({ name });
      setFormBrands((prev) => [...prev, newBrand]);
      setFormBrandId(newBrand.id);
      alert("Marca agregada correctamente.");
    } catch {
      alert("Error al agregar marca.");
    }
  };

  const handleAddModel = async () => {
    if (!formBrandId) return alert("Seleccione primero una marca.");
    const name = prompt("Ingrese el nombre del nuevo modelo:");
    if (!name?.trim()) return;
    try {
      const newModel = await createModel(formBrandId, { name });
      setFormModels((prev) => [...prev, newModel]);
      setFormModelId(newModel.id);
      alert("Modelo agregado correctamente.");
    } catch {
      alert("Error al agregar modelo.");
    }
  };

  const handleAddVersion = async () => {
    if (!formModelId) return alert("Seleccione primero un modelo.");
    const name = prompt("Ingrese el nombre de la nueva versión:");
    if (!name?.trim()) return;
    try {
      const newVersion = await createVersion(formModelId, { name });
      setFormVersions((prev) => [...prev, newVersion]);
      setFormVersionId(newVersion.id);
      alert("Versión agregada correctamente.");
    } catch {
      alert("Error al agregar versión.");
    }
  };

  // ======= FORZAR ACTUALIZACIÓN DE ESTADOS =======
  const handleForceUpdateStatus = async () => {
    if (
      !window.confirm(
        "¿Deseas actualizar los estados de reservas y vehículos ahora?"
      )
    )
      return;
    try {
      setLoading(true);
      await api.post("/reservations/expire");
      alert(
        "✅ Estados actualizados correctamente. Vehículos liberados si correspondía."
      );
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar estados:", error);
      alert("❌ Error al actualizar estados de vehículos.");
    } finally {
      setLoading(false);
    }
  };

  // ======= SUBMIT FORM =======
  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    // ✅ Bloqueo extra (por si alguien intenta abrir el modal manualmente)
    if (!canCreate && !editing) {
      alert("No tenés permisos para crear vehículos.");
      return;
    }
    if (!canEdit && editing) {
      alert("No tenés permisos para editar vehículos.");
      return;
    }

    const fd = new FormData(ev.currentTarget);
    const versionId = formVersionId ? Number(formVersionId) : undefined;

    // ✅ NUEVOS CAMPOS
    const rawKilometraje = fd.get("kilometraje");
    const kilometraje =
      rawKilometraje === null || String(rawKilometraje).trim() === ""
        ? null
        : Number(rawKilometraje);

    const concesionariaRaw = String(fd.get("concesionaria") || "").trim();
    const procedenciaRaw = String(fd.get("procedencia") || "").trim();

    const payload = {
      versionId,
      year: Number(fd.get("year") as string),

      // ✅ Kilometraje (después de año)
      kilometraje,

      plate: String(fd.get("plate") || ""),
      engineNumber: String(fd.get("engineNumber") || ""),
      chassisNumber: String(fd.get("chassisNumber") || ""),

      // ✅ Concesionaria (después de chasis)
      concesionaria: concesionariaRaw ? concesionariaRaw : null,

      // ✅ Procedencia (después de concesionaria)
      procedencia: procedenciaRaw ? procedenciaRaw : null,

      color: String(fd.get("color") || ""),
      price: Number(fd.get("price") as string),
      status: String(fd.get("status") || "available"),
    };

    if (!payload.versionId) {
      alert("Seleccioná marca, modelo y versión");
      return;
    }

    // Validaciones suaves frontend
    if (payload.kilometraje !== null && Number.isNaN(payload.kilometraje)) {
      alert("Kilometraje inválido.");
      return;
    }
    if (
      payload.concesionaria !== null &&
      !CONCESIONARIAS.includes(payload.concesionaria as any)
    ) {
      alert("Concesionaria inválida.");
      return;
    }
    if (
      payload.procedencia !== null &&
      !PROCEDENCIAS.includes(payload.procedencia as any)
    ) {
      alert("Procedencia inválida.");
      return;
    }

    try {
      let saved: any;
      if (editing) {
        saved = await updateVehicle(editing.id, payload as any);
      } else {
        saved = await createVehicle(payload as any);
      }

      // 📁 si hay documentación, la subimos al endpoint /vehicles/:id/documentation
      if (docFile && saved?.id) {
        try {
          const docFd = new FormData();
          docFd.append("file", docFile);
          await api.post(`/vehicles/${saved.id}/documentation`, docFd);
        } catch (err) {
          console.error("Error subiendo documentación de vehículo:", err);
          alert(
            "El vehículo se guardó, pero hubo un error al subir la documentación."
          );
        }
      }

      setShowForm(false);
      setEditing(null);
      setDocFile(null);
      setFormBrandId(undefined);
      setFormModelId(undefined);
      setFormVersionId(undefined);
      setFormModels([]);
      setFormVersions([]);

      (ev.target as HTMLFormElement).reset();
      await fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error guardando vehículo");
    }
  };

  const onDelete = async (v: Vehicle) => {
    if (!canDelete) {
      alert("No tenés permisos para eliminar vehículos.");
      return;
    }
    if (!window.confirm(`¿Eliminar ${v.brand} ${v.model} (${v.plate})?`)) return;
    try {
      await deleteVehicle(v.id);
      await fetchData();
    } catch {
      alert("Error al eliminar");
    }
  };

  const handleOpenDocumentation = async (id: number) => {
    try {
      const resp = await api.get(`/vehicles/${id}/documentation`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(resp.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert("Tu sesión expiró. Volvé a iniciar sesión.");
      } else if (err?.response?.status === 404) {
        alert("No se encontró la documentación del vehículo.");
      } else {
        alert("Error al abrir la documentación.");
      }
      console.error("Error abriendo documentación:", err);
    }
  };

  // 👉 NUEVO: abrir modal de NUEVO vehículo reseteando todo el form
  const handleOpenNewVehicleModal = () => {
    if (!canCreate) {
      alert("No tenés permisos para crear vehículos.");
      return;
    }
    setEditing(null);
    setDocFile(null);
    setFormBrandId(undefined);
    setFormModelId(undefined);
    setFormVersionId(undefined);
    setFormModels([]);
    setFormVersions([]);
    setShowForm(true);
  };

  // 👉 EDITAR: cargar marca / modelo / versión por nombre sin que los useEffect los pisen
  const handleOpenEditVehicleModal = (v: Vehicle) => {
    if (!canEdit) {
      alert("No tenés permisos para editar vehículos.");
      return;
    }

    setEditing(v);
    setDocFile(null);

    const anyV = v as any;
    const brandName = anyV.brand as string | undefined;
    const modelName = anyV.model as string | undefined;
    const versionName = anyV.versionName as string | undefined;

    (async () => {
      let brandsList = formBrands;
      if (!brandsList || brandsList.length === 0) {
        brandsList = await listBrands();
        setFormBrands(brandsList);
      }

      const brand = brandsList.find((b) => b.name === brandName);
      const brandId = brand?.id;
      setFormBrandId(brandId);

      if (!brandId) {
        setFormModels([]);
        setFormVersions([]);
        setFormModelId(undefined);
        setFormVersionId(undefined);
        setShowForm(true);
        return;
      }

      const modelsList = await listModels(brandId);
      setFormModels(modelsList);

      const model = modelsList.find((m) => m.name === modelName);
      const modelId = model?.id;
      setFormModelId(modelId);

      if (!modelId) {
        setFormVersions([]);
        setFormVersionId(undefined);
        setShowForm(true);
        return;
      }

      const versionsList = await listVersions(modelId);
      setFormVersions(versionsList);

      const version = versionsList.find((ver) => ver.name === versionName);
      const versionId = version?.id;
      setFormVersionId(versionId);

      setShowForm(true);
    })();
  };

  // ======= RENDER =======
  return (
    <div className="vehicles-container">
      <h1>Vehículos</h1>

      {/* FILTROS PRINCIPALES */}
      <div className="filters-main" style={{ flexWrap: "wrap" }}>
        <select
          value={query.brandId || ""}
          onChange={(e) =>
            setField(
              "brandId",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
        >
          <option value="">Marca</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={query.modelId || ""}
          onChange={(e) =>
            setField(
              "modelId",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          disabled={!query.brandId}
        >
          <option value="">
            {query.brandId ? "Modelo" : "Modelo (selecciona marca)"}
          </option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={query.versionId || ""}
          onChange={(e) =>
            setField(
              "versionId",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          disabled={!query.modelId}
        >
          <option value="">
            {query.modelId ? "Versión" : "Versión (selecciona modelo)"}
          </option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Año"
          type="number"
          value={query.yearMin || ""}
          onChange={(e) =>
            setField(
              "yearMin",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
        />
        <input
          placeholder="Patente"
          value={query.plate || ""}
          onChange={(e) => setField("plate", e.target.value)}
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
        <button className="btn-primary" onClick={() => fetchData()}>
          Buscar
        </button>
      </div>

      {showMoreFilters && (
        <div className="filters-more">
          <input
            placeholder="Color"
            value={query.color || ""}
            onChange={(e) => setField("color", e.target.value)}
          />

          {/* ✅ NUEVO FILTRO: Concesionaria */}
          <select
            value={(query as any).concesionaria || ""}
            onChange={(e) =>
              setField(
                "concesionaria" as any,
                e.target.value ? e.target.value : undefined
              )
            }
          >
            <option value="">Concesionaria</option>
            {CONCESIONARIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={query.status || ""}
            onChange={(e) => setField("status", e.target.value || undefined)}
          >
            <option value="">Estado</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
          </select>
        </div>
      )}

      {/* ACCIONES */}
      <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
        {canCreate && (
          <button className="btn-primary" onClick={handleOpenNewVehicleModal}>
            Nuevo vehículo
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={handleForceUpdateStatus}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar estado"}
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
              <th>Marca</th>
              <th>Modelo</th>
              <th>Versión</th>
              <th>Año</th>

              {/* ✅ NUEVOS CAMPOS EN LISTA */}
              <th>Kilometraje</th>
              <th>Concesionaria</th>
              <th>Procedencia</th>

              <th>Patente</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Documentación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((v) => {
              const anyV = v as any;
              const docPath = anyV.documentationPath;

              return (
                <tr key={v.id}>
                  <td>{anyV.brand}</td>
                  <td>{anyV.model}</td>
                  <td>{anyV.versionName}</td>
                  <td>{v.year}</td>

                  {/* ✅ NUEVOS CAMPOS EN LISTA */}
                  <td>
                    {anyV.kilometraje !== null &&
                    anyV.kilometraje !== undefined &&
                    String(anyV.kilometraje).trim() !== ""
                      ? Number(anyV.kilometraje).toLocaleString()
                      : "—"}
                  </td>
                  <td>{anyV.concesionaria || "—"}</td>
                  <td>{anyV.procedencia || "—"}</td>

                  <td>{v.plate}</td>
                  <td>{v.color}</td>
                  <td>${v.price.toLocaleString()}</td>
                  <td>
                    {v.status === "available"
                      ? "Disponible"
                      : v.status === "reserved"
                      ? "Reservado"
                      : "Vendido"}
                  </td>
                  <td>
                    {docPath ? (
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenDocumentation(v.id)}
                      >
                        Ver
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {canEdit && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenEditVehicleModal(v)}
                        style={{ marginRight: 6 }}
                      >
                        Editar
                      </button>
                    )}

                    {canDelete && (
                      <button className="btn-danger" onClick={() => onDelete(v)}>
                        Eliminar
                      </button>
                    )}

                    {!canEdit && !canDelete && "—"}
                  </td>
                </tr>
              );
            })}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={13} style={{ textAlign: "center", padding: 24 }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* PAGINACIÓN */}
      <div className="pagination">
        <span>Resultados: {data.total}</span>
        <select
          value={query.limit || 10}
          onChange={(e) => setField("limit", Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {pages.map((p) => (
            <button
              key={p}
              disabled={p === (query.page || 1)}
              onClick={() => setField("page", p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar vehículo" : "Nuevo vehículo"}</h3>
            <form onSubmit={onSubmit}>
              {/* Selects dependientes */}
              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  value={formBrandId || ""}
                  onChange={(e) =>
                    setFormBrandId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  required
                >
                  <option value="">Marca</option>
                  {formBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddBrand}
                >
                  Agregar
                </button>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  value={formModelId || ""}
                  onChange={(e) =>
                    setFormModelId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  required
                  disabled={!formBrandId}
                >
                  <option value="">
                    {formBrandId ? "Modelo" : "Modelo (selecciona marca)"}
                  </option>
                  {formModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!formBrandId}
                  onClick={handleAddModel}
                >
                  Agregar
                </button>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  value={formVersionId || ""}
                  onChange={(e) =>
                    setFormVersionId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  required
                  disabled={!formModelId}
                >
                  <option value="">
                    {formModelId ? "Versión" : "Versión (selecciona modelo)"}
                  </option>
                  {formVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!formModelId}
                  onClick={handleAddVersion}
                >
                  Agregar
                </button>
              </div>

              {/* Resto del formulario */}
              <input
                name="year"
                type="number"
                placeholder="Año"
                defaultValue={editing?.year || ""}
                required
              />

              {/* ✅ NUEVO: Kilometraje (después de Año) */}
              <input
                name="kilometraje"
                type="number"
                placeholder="Kilometraje"
                defaultValue={(editing as any)?.kilometraje ?? ""}
                min={0}
              />

              <input
                name="plate"
                placeholder="Patente"
                defaultValue={editing?.plate || ""}
                required
              />
              <input
                name="color"
                placeholder="Color"
                defaultValue={editing?.color || ""}
                required
              />
              <input
                name="engineNumber"
                placeholder="N° motor"
                defaultValue={editing?.engineNumber || ""}
                required
              />
              <input
                name="chassisNumber"
                placeholder="N° chasis"
                defaultValue={editing?.chassisNumber || ""}
                required
              />

              {/* ✅ NUEVO: Concesionaria (después de N° chasis) */}
              <select
                name="concesionaria"
                defaultValue={(editing as any)?.concesionaria ?? ""}
              >
                <option value="">Concesionaria</option>
                {CONCESIONARIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* ✅ NUEVO: Procedencia (después de Concesionaria) */}
              <select
                name="procedencia"
                defaultValue={(editing as any)?.procedencia ?? ""}
              >
                <option value="">Procedencia</option>
                {PROCEDENCIAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Precio"
                defaultValue={editing?.price || ""}
                required
              />
              <select
                name="status"
                defaultValue={editing?.status || "available"}
                required
              >
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
              </select>

              {/* 📁 Campo para documentación */}
              <input
                type="file"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setDocFile(null);
                    setFormBrandId(undefined);
                    setFormModelId(undefined);
                    setFormVersionId(undefined);
                    setFormModels([]);
                    setFormVersions([]);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
