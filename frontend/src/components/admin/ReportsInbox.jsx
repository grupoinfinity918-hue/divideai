import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authHeader } from '../../context/AuthContext';

const LABELS = { LISTING: 'Anúncio', USER: 'Usuário', CHAT: 'Chat' };

export default function ReportsInbox() {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

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

  async function openChatWithReporter(reporterId) {
    const res = await fetch(`/api/admin/support-chats/with/${reporterId}`, { method: 'POST', headers: authHeader() });
    if (res.ok) {
      const chat = await res.json();
      navigate(`/suporte/${chat.id}`);
    }
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

            {r.targetType === 'LISTING' && r.targetLabel && (
              <a
                href={`/produto/${r.targetId}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-pink-neon hover:underline block mb-1"
              >
                Ver anúncio denunciado: {r.targetLabel}
              </a>
            )}

            <p className="text-sm text-gray-700">{r.reason}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Por: {r.reporter?.name} ({r.reporter?.email})</p>
              <button onClick={() => openChatWithReporter(r.reporter.id)} className="text-xs text-pink-neon font-semibold hover:underline">
                Abrir chat com o denunciante
              </button>
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-sm text-gray-400">Nenhuma denúncia pendente.</p>}
      </div>
    </div>
  );
}
