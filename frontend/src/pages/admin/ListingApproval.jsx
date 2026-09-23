import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

function diffFields(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  return Array.from(keys).map(key => ({
    key,
    before: before?.[key],
    after: after?.[key],
    changed: JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])
  }));
}

export default function ListingApproval() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    const res = await fetch('/api/admin/listing-edits?status=PENDING_APPROVAL', { headers: authHeader() });
    if (res.ok) setPending(await res.json());
  }

  async function decide(editId, decision) {
    await fetch(`/api/admin/listing-edits/${editId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ decision })
    });
    setPending(prev => prev.filter(e => e.id !== editId));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Aprovação de Anúncios Editados</h2>
      {pending.length === 0 && <p className="text-sm text-gray-400">Nenhuma edição pendente.</p>}

      <div className="flex flex-col gap-6">
        {pending.map(edit => {
          const rows = diffFields(edit.beforeData, edit.afterData);
          return (
            <div key={edit.id} className="card p-5">
              <h4 className="font-bold mb-3">Anúncio #{edit.listingId}</h4>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-pink-100">
                    <th className="p-2">Campo</th>
                    <th className="p-2">Antes</th>
                    <th className="p-2">Depois</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key} className={`border-b border-pink-50 ${row.changed ? 'bg-pink-soft' : ''}`}>
                      <td className="p-2 font-semibold">{row.key}</td>
                      <td className={`p-2 ${row.changed ? 'text-pink-dark line-through' : ''}`}>
                        {String(row.before ?? '—')}
                      </td>
                      <td className={`p-2 ${row.changed ? 'text-pink-neon font-bold' : ''}`}>
                        {String(row.after ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-3 mt-4">
                <button className="btn-primary text-sm" onClick={() => decide(edit.id, 'APPROVE')}>Aprovar</button>
                <button className="btn-outline text-sm" onClick={() => decide(edit.id, 'REJECT')}>Rejeitar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
