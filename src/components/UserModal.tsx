import React, { useEffect, useState } from 'react';
import { getRoles } from '../services/userService';

export default function UserModal({ isOpen, onClose, onSave, user }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: 2 });
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (user) setForm({ ...user, password: '' });
    else setForm({ name: '', email: '', password: '', roleId: 2 });
    getRoles().then((res) => setRoles(res.data));
  }, [user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{user ? 'Editar usuario' : 'Nuevo usuario'}</h2>

        <div className="space-y-3">
          <input
            placeholder="Nombre"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Email"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
          >
            {roles.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
