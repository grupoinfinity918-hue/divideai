import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

const LABELS = { LISTING: 'Anúncio', USER: 'Usuário', CHAT: 'Chat' };

export default function ReportsInbox() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/admin/reports', { headers: authHeader() });
    if (res.ok) setReports(await res.json());
  }

  async function resolve(id) {
    setReports(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/admin/reports/${id}/resolve`, { method: 'POST', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Denúncias</h2>
      <div className="flex flex-col gap-3 max-w-2xl">
        {reports.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-pink-neon bg-pink-soft px-2 py-1 rounded-full">
                {LABELS[r.targetType] || r.targetType}
              </span>
              <button onClick={() => resolve(r.id)} className="btn-outline text-xs px-3 py-1">
                Marcar como Resolvida
              </button>
            </div>
            <p className="text-sm text-gray-700">{r.reason}</p>
            <p className="text-xs text-gray-400 mt-1">Por: {r.reporter?.name} ({r.reporter?.email})</p>
          </div>
        ))}
        {reports.length === 0 && <p className="text-sm text-gray-400">Nenhuma denúncia pendente.</p>}
      </div>
    </div>
  );
}
