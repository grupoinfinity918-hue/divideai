import { useEffect, useState } from 'react';

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
    const res = await fetch('/api/admin/listing-edits?status=PENDING_APPROVAL');
    if (res.ok) setPending(await res.json());
  }

  async function decide(editId, decision) {
    await fetch(`/api/admin/listing-edits/${editId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    setPending(prev => prev.filter(e => e.id !== editId));
  }

  return (
    <div className="da-container" style={{ paddingTop: 24 }}>
      <h2>Aprovação de Anúncios Editados</h2>
      {pending.length === 0 && <p style={{ color: 'var(--da-text-muted)' }}>Nenhuma edição pendente.</p>}

      <div style={{ display: 'grid', gap: 20 }}>
        {pending.map(edit => {
          const rows = diffFields(edit.beforeData, edit.afterData);
          return (
            <div key={edit.id} className="da-card">
              <h4 style={{ marginTop: 0 }}>Anúncio #{edit.listingId}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--da-border)' }}>
                    <th style={{ padding: 6 }}>Campo</th>
                    <th style={{ padding: 6 }}>Antes</th>
                    <th style={{ padding: 6 }}>Depois</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key} style={{
                      background: row.changed ? '#fff0f5' : 'transparent',
                      borderBottom: '1px solid var(--da-border)'
                    }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{row.key}</td>
                      <td style={{ padding: 6, color: row.changed ? '#b30046' : 'inherit', textDecoration: row.changed ? 'line-through' : 'none' }}>
                        {String(row.before ?? '—')}
                      </td>
                      <td style={{ padding: 6, color: row.changed ? 'var(--da-primary-dark)' : 'inherit', fontWeight: row.changed ? 700 : 400 }}>
                        {String(row.after ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="da-btn" onClick={() => decide(edit.id, 'APPROVE')}>Aprovar</button>
                <button className="da-btn da-btn-outline" onClick={() => decide(edit.id, 'REJECT')}>Rejeitar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
