import React, { useEffect, useMemo, useRef, useState } from "react";
import { Vehicle } from "../types/vehicle";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  VehicleQuery,
} from "../api/vehicles";
import { listBrands } from "../api/brands";
import { listModels } from "../api/models";
import { listVersions } from "../api/versions";
import { Brand, Model, Version } from "../types/catalog";
import "./Vehicles.css";
import { API_URL } from "../config";


const initialQuery: VehicleQuery = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

export default function VehiclesPage() {
  // Listado
  const [query, setQuery] = useState<VehicleQuery>(initialQuery);
  const [data, setData] = useState<{ items: Vehicle[]; total: number; totalPages: number }>({
    items: [],
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos (para filtros)
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  // UI
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Carga catálogo base
  useEffect(() => {
    (async () => {
      try {
        const bs = await listBrands();
        setBrands(bs);
      } catch {}
    })();
  }, []);

  // Carga dependiente de modelos según brandId (filtro)
  useEffect(() => {
    (async () => {
      if (query.brandId) {
        const ms = await listModels(query.brandId);
        setModels(ms);
      } else {
        setModels([]);
      }
      // reset dependientes
      setVersions([]);
      setQuery((q) => ({ ...q, modelId: undefined, versionId: undefined }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.brandId]);

  // Carga dependiente de versiones según modelId (filtro)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.modelId]);

  // Listado
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listVehicles(query);
      setData({ items: res.items, total: res.total, totalPages: res.totalPages });
    } catch (e: any) {
      setError(e?.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [JSON.stringify(query)]);

// SSE (actualización en tiempo real)
const esRef = useRef<EventSource | null>(null);

useEffect(() => {
  // Usamos la misma constante global que en api.ts
  const es = new EventSource(`${API_URL}/vehicles/stream`, { withCredentials: false });

  es.onmessage = () => fetchData();      // Cuando hay un cambio, recarga datos
  es.onerror = (err) => {
    console.warn("❌ Error SSE:", err);
  };

  esRef.current = es;

  return () => es.close();               // Cierra la conexión al desmontar
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // Helpers
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

  // ======= FORMULARIO (ALTA/EDICIÓN) =======
  // Catálogos del formulario (independientes del filtro, para no pisarlos)
  const [formBrands, setFormBrands] = useState<Brand[]>([]);
  const [formModels, setFormModels] = useState<Model[]>([]);
  const [formVersions, setFormVersions] = useState<Version[]>([]);
  const [formBrandId, setFormBrandId] = useState<number | undefined>(undefined);
  const [formModelId, setFormModelId] = useState<number | undefined>(undefined);
  const [formVersionId, setFormVersionId] = useState<number | undefined>(undefined);

  // Carga inicial de marcas para formulario
  useEffect(() => {
    (async () => {
      try {
        const bs = await listBrands();
        setFormBrands(bs);
      } catch {}
    })();
  }, []);

  // Si se edita, precargamos brand/model/version a partir de los textos denormalizados (si contamos con relaciones)
  useEffect(() => {
    (async () => {
      if (editing) {
        // Intentamos inferir la cadena de ids a partir de los catálogos
        const bs = formBrands.length ? formBrands : await listBrands();
        setFormBrands(bs);

        const brand = bs.find((b) => b.name.toLowerCase() === (editing as any).brand?.toLowerCase());
        if (brand) {
          setFormBrandId(brand.id);
          const ms = await listModels(brand.id);
          setFormModels(ms);

          const model = ms.find((m) => m.name.toLowerCase() === (editing as any).model?.toLowerCase());
          if (model) {
            setFormModelId(model.id);
            const vs = await listVersions(model.id);
            setFormVersions(vs);

            const version = vs.find((v) => v.name.toLowerCase() === (editing as any).versionName?.toLowerCase());
            if (version) {
              setFormVersionId(version.id);
            } else {
              setFormVersionId(undefined);
            }
          } else {
            setFormModelId(undefined);
            setFormVersions([]);
            setFormVersionId(undefined);
          }
        } else {
          setFormBrandId(undefined);
          setFormModels([]);
          setFormModelId(undefined);
          setFormVersions([]);
          setFormVersionId(undefined);
        }
      } else {
        // reset
        setFormBrandId(undefined);
        setFormModelId(undefined);
        setFormVersionId(undefined);
        setFormModels([]);
        setFormVersions([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, formBrands.length]);

  // Dependencias del formulario
  useEffect(() => {
    (async () => {
      if (formBrandId) {
        const ms = await listModels(formBrandId);
        setFormModels(ms);
      } else {
        setFormModels([]);
      }
      setFormModelId(undefined);
      setFormVersions([]);
      setFormVersionId(undefined);
    })();
  }, [formBrandId]);

  useEffect(() => {
    (async () => {
      if (formModelId) {
        const vs = await listVersions(formModelId);
        setFormVersions(vs);
      } else {
        setFormVersions([]);
      }
      setFormVersionId(undefined);
    })();
  }, [formModelId]);

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    // versionId viene del select controlado
    const versionId = formVersionId ? Number(formVersionId) : undefined;

    const payload = {
      versionId,
      year: Number(fd.get("year") as string),
      plate: String(fd.get("plate") || ""),
      engineNumber: String(fd.get("engineNumber") || ""),
      chassisNumber: String(fd.get("chassisNumber") || ""),
      color: String(fd.get("color") || ""),
      price: Number(fd.get("price") as string),
      status: String(fd.get("status") || "available"),
    };

    if (!payload.versionId) {
      alert("Seleccioná marca, modelo y versión");
      return;
    }

    try {
      if (editing) await updateVehicle(editing.id, payload as any);
      else await createVehicle(payload as any);

      setShowForm(false);
      setEditing(null);
      (ev.target as HTMLFormElement).reset();
      await fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error guardando vehículo");
    }
  };

  const onDelete = async (v: Vehicle) => {
    if (!confirm(`¿Eliminar ${v.brand} ${v.model} (${v.plate})?`)) return;
    try {
      await deleteVehicle(v.id);
      await fetchData();
    } catch {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="vehicles-container">
      <h1>Vehículos</h1>

      {/* Filtros principales en una fila */}
      <div className="filters-main" style={{ flexWrap: "wrap" }}>
        <select
          value={query.brandId || ""}
          onChange={(e) => setField("brandId", e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Marca</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={query.modelId || ""}
          onChange={(e) => setField("modelId", e.target.value ? Number(e.target.value) : undefined)}
          disabled={!query.brandId}
        >
          <option value="">{query.brandId ? "Modelo" : "Modelo (selecciona marca)"}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <select
          value={query.versionId || ""}
          onChange={(e) => setField("versionId", e.target.value ? Number(e.target.value) : undefined)}
          disabled={!query.modelId}
        >
          <option value="">{query.modelId ? "Versión" : "Versión (selecciona modelo)"}</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        <input
          placeholder="Año"
          type="number"
          value={query.yearMin || ""}
          onChange={(e) => setField("yearMin", e.target.value ? Number(e.target.value) : undefined)}
        />

        <input
          placeholder="Patente"
          value={query.plate || ""}
          onChange={(e) => setField("plate", e.target.value)}
        />

        <button className="btn-secondary" onClick={() => setShowMoreFilters(!showMoreFilters)}>
          {showMoreFilters ? "Ocultar filtros" : "Más filtros"}
        </button>
        <button className="btn-secondary" onClick={clearFilters}>Limpiar</button>
        <button className="btn-primary" onClick={() => fetchData()}>Buscar</button>
      </div>

      {/* Filtros secundarios */}
      {showMoreFilters && (
        <div className="filters-more">
          <input
            placeholder="Color"
            value={query.color || ""}
            onChange={(e) => setField("color", e.target.value)}
          />
          <select
            value={query.status || ""}
            onChange={(e) => setField("status", e.target.value || undefined)}
          >
            <option value="">Estado</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
          </select>
          <input
            placeholder="Precio mín"
            type="number"
            value={query.priceMin || ""}
            onChange={(e) =>
              setField("priceMin", e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <input
            placeholder="Precio máx"
            type="number"
            value={query.priceMax || ""}
            onChange={(e) =>
              setField("priceMax", e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <input
            placeholder="Texto libre"
            value={query.q || ""}
            onChange={(e) => setField("q", e.target.value)}
          />
        </div>
      )}

      {/* Acciones */}
      <div style={{ marginBottom: 12 }}>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Nuevo vehículo
        </button>
      </div>

      {/* Tabla */}
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
              <th>Patente</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((v) => (
              <tr key={v.id}>
                <td>{(v as any).brand}</td>
                <td>{(v as any).model}</td>
                <td>{(v as any).versionName}</td>
                <td>{v.year}</td>
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
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditing(v);
                      setShowForm(true);
                    }}
                    style={{ marginRight: 6 }}
                  >
                    Editar
                  </button>
                  <button className="btn-danger" onClick={() => onDelete(v)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Paginación */}
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

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar vehículo" : "Nuevo vehículo"}</h3>
            <form onSubmit={onSubmit}>
              {/* Selects dependientes */}
              <select
                value={formBrandId || ""}
                onChange={(e) => setFormBrandId(e.target.value ? Number(e.target.value) : undefined)}
                required
              >
                <option value="">Marca</option>
                {formBrands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={formModelId || ""}
                onChange={(e) => setFormModelId(e.target.value ? Number(e.target.value) : undefined)}
                required
                disabled={!formBrandId}
              >
                <option value="">{formBrandId ? "Modelo" : "Modelo (selecciona marca)"}</option>
                {formModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <select
                value={formVersionId || ""}
                onChange={(e) => setFormVersionId(e.target.value ? Number(e.target.value) : undefined)}
                required
                disabled={!formModelId}
                name="versionId" // no usamos fd.get; lo tomamos del estado
              >
                <option value="">{formModelId ? "Versión" : "Versión (selecciona modelo)"}</option>
                {formVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>

              {/* Resto del formulario */}
              <input name="year" type="number" placeholder="Año" defaultValue={editing?.year || ""} required />
              <input name="plate" placeholder="Patente" defaultValue={editing?.plate || ""} required />
              <input name="color" placeholder="Color" defaultValue={editing?.color || ""} required />
              <input name="engineNumber" placeholder="N° motor" defaultValue={editing?.engineNumber || ""} required />
              <input name="chassisNumber" placeholder="N° chasis" defaultValue={editing?.chassisNumber || ""} required />
              <input name="price" type="number" step="0.01" placeholder="Precio" defaultValue={editing?.price || ""} required />
              <select name="status" defaultValue={editing?.status || "available"} required>
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
