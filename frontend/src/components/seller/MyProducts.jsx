import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';
import { ICON_MAP } from '../common/ProductCard';

function EditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item.title,
    price: item.price,
    slotsTotal: item.slotsTotal,
    description: item.description,
    rules: item.rules || '',
    icon: item.icon
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/seller/listings/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-4">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col gap-3">
        <h3 className="font-bold text-gray-900">Editar Anúncio</h3>
        <p className="text-xs text-gray-500 bg-pink-soft rounded-xl px-3 py-2">
          A edição sai do ar e só volta depois que o admin aprovar a alteração.
        </p>

        <div className="flex gap-2 flex-wrap">
          {Object.entries(ICON_MAP).map(([key, emoji]) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm({ ...form, icon: key })}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 ${
                form.icon === key ? 'border-pink-neon bg-pink-soft' : 'border-pink-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Título"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            placeholder="Preço"
            className="border border-pink-100 rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.slotsTotal}
            onChange={e => setForm({ ...form, slotsTotal: e.target.value })}
            placeholder="Vagas"
            className="border border-pink-100 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Descrição"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm"
        />
        <textarea
          value={form.rules}
          onChange={e => setForm({ ...form, rules: e.target.value })}
          rows={2}
          placeholder="Regras"
          className="border border-pink-100 rounded-xl px-3 py-2 text-sm"
        />

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="btn-outline text-sm flex-1">Cancelar</button>
          <button className="btn-primary text-sm flex-1" disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar para Aprovação'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MyProducts() {
  const [listings, setListings] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/seller/listings', { headers: authHeader() });
    if (res.ok) setListings(await res.json());
  }

  async function remove(id) {
    setListings(prev => prev.filter(l => l.id !== id));
    await fetch(`/api/seller/listings/${id}`, { method: 'DELETE', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Meus Produtos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-pink-100 text-gray-500">
              <th className="p-2">Produto</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Vagas</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(item => (
              <tr key={item.id} className="border-b border-pink-50">
                <td className="p-2 font-medium">{ICON_MAP[item.icon] || '📺'} {item.title}</td>
                <td className="p-2">R$ {Number(item.price).toFixed(2)}</td>
                <td className="p-2">{item.slotsAvailable}/{item.slotsTotal}</td>
                <td className="p-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.status === 'ACTIVE' ? 'Ativo' : item.status}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setEditing(item)} className="btn-outline text-xs px-3 py-1">Editar</button>
                  <button onClick={() => remove(item.id)} className="text-xs px-3 py-1 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}
