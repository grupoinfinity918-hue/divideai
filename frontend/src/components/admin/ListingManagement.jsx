import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function ListingManagement() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/admin/listings', { headers: authHeader() });
    if (res.ok) setListings(await res.json());
  }

  async function remove(id) {
    setListings(prev => prev.filter(l => l.id !== id));
    await fetch(`/api/admin/listings/${id}`, { method: 'DELETE', headers: authHeader() });
  }

  async function toggleFeature(id) {
    setListings(prev => prev.map(l => (l.id === id ? { ...l, isPrioritario: !l.isPrioritario } : l)));
    await fetch(`/api/admin/listings/${id}/feature`, { method: 'PATCH', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Gestão de Anúncios</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="text-left border-b border-pink-100 text-gray-500">
              <th className="p-2">Título</th>
              <th className="p-2">Vendedor</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(item => (
              <tr key={item.id} className="border-b border-pink-50">
                <td className="p-2 font-medium">
                  {item.title}
                  {item.isPrioritario && (
                    <span className="ml-2 text-[10px] font-bold text-pink-neon bg-pink-soft px-2 py-0.5 rounded-full">
                      Destaque
                    </span>
                  )}
                </td>
                <td className="p-2">{item.seller?.name}</td>
                <td className="p-2">{item.category?.name}</td>
                <td className="p-2">R$ {Number(item.price).toFixed(2)}</td>
                <td className="p-2 flex gap-2 flex-wrap">
                  <button onClick={() => toggleFeature(item.id)} className="btn-outline text-xs px-3 py-1">
                    {item.isPrioritario ? 'Remover Destaque' : 'Dar Prioridade'}
                  </button>
                  <button onClick={() => remove(item.id)} className="text-xs px-3 py-1 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                    Apagar Anúncio
                  </button>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum anúncio cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
