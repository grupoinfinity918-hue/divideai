import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, password: '' });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-4">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-3">
        <h3 className="font-bold text-gray-900">Editar Usuário</h3>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Nome"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
        />
        <input
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="E-mail"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
        />
        <input
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="Telefone"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
        />
        <input
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="Nova senha (opcional)"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
        />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="btn-outline text-sm flex-1">Cancelar</button>
          <button className="btn-primary text-sm flex-1" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/admin/users', { headers: authHeader() });
    if (res.ok) setUsers(await res.json());
  }

  async function toggleBan(id) {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, banned: !u.banned } : u)));
    await fetch(`/api/admin/users/${id}/ban`, { method: 'PATCH', headers: authHeader() });
  }

  async function remove(id) {
    setUsers(prev => prev.filter(u => u.id !== id));
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Gestão de Usuários</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-pink-100 text-gray-500">
              <th className="p-2">Nome</th>
              <th className="p-2">E-mail</th>
              <th className="p-2">Cargo</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-pink-50">
                <td className="p-2 font-medium">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.banned ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {u.banned ? 'Banido' : 'Ativo'}
                  </span>
                </td>
                <td className="p-2 flex gap-2 flex-wrap">
                  <button onClick={() => setEditing(u)} className="btn-outline text-xs px-3 py-1">Alterar Dados/Senha</button>
                  <button onClick={() => toggleBan(u.id)} className="btn-outline text-xs px-3 py-1">
                    {u.banned ? 'Ativar' : 'Banir'}
                  </button>
                  <button onClick={() => remove(u.id)} className="text-xs px-3 py-1 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                    Excluir Conta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
