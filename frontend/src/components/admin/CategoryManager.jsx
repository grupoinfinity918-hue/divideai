import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      setName('');
      load();
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    setCategories(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Gerenciar Categorias</h2>

      <form onSubmit={handleAdd} className="flex gap-2 max-w-md mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Streaming, IAs, Jogos..."
          className="flex-1 border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-neon"
        />
        <button className="btn-primary text-sm" disabled={saving}>Adicionar</button>
      </form>

      <div className="flex flex-col gap-2 max-w-md">
        {categories.map(cat => (
          <div key={cat.id} className="card p-3 flex items-center justify-between">
            <span className="text-sm font-medium">{cat.name}</span>
            <button onClick={() => handleDelete(cat.id)} className="text-xs text-pink-dark hover:underline">
              Remover
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-gray-400">Nenhuma categoria cadastrada.</p>}
      </div>
    </div>
  );
}
