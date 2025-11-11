import React, { useEffect, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../api/users";
import { listRoles } from "../api/roles";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchData();
    (async () => {
      try {
        const r = await listRoles();
        setRoles(r);
      } catch {}
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listUsers({ q: search });
      setUsers(data);
    } catch (e) {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const payload = Object.fromEntries(fd.entries());

    // ✅ Convertir isActive → boolean
    payload.isActive = payload.isActive === "true";
    payload.roleId = Number(payload.roleId);

    // ✅ Si es edición y password vacío → no enviarlo
    if (editing && !payload.password) delete payload.password;

    try {
      if (editing) await updateUser(editing.id, payload);
      else await createUser(payload);

      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch {
      alert("Error al guardar usuario");
    }
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      fetchData();
    } catch {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="users-container">
      <h1>Usuarios</h1>

      {/* ✅ Filtros principales */}
      <div className="filters-main">
        <input
          placeholder="Buscar por nombre o email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-primary" onClick={fetchData}>
          Buscar
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setSearch("");
            fetchData();
          }}
        >
          Limpiar
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Nuevo usuario
        </button>
      </div>

      {/* ✅ Tabla */}
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role?.name || "-"}</td>
                <td>{u.isActive ? "Sí" : "No"}</td>
                <td>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditing(u);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </button>
                  <button className="btn-danger" onClick={() => onDelete(u.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                  No hay usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ✅ Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar usuario" : "Nuevo usuario"}</h3>
            <form onSubmit={onSubmit}>
              <input
                name="name"
                placeholder="Nombre"
                defaultValue={editing?.name || ""}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                defaultValue={editing?.email || ""}
                required
              />

              {/* ✅ Contraseña solo al crear (editable opcional al editar) */}
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                required={!editing}
              />

              {/* ✅ Selección de rol */}
              <select
                name="roleId"
                defaultValue={editing?.role?.id || ""}
                required
              >
                <option value="">Seleccionar rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* ✅ Estado */}
              <select
                name="isActive"
                defaultValue={editing?.isActive ? "true" : "false"}
                required
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
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
