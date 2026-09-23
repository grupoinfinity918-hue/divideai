import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const COLUMNS = [
  { key: 'AWAITING_SHIPMENT', label: 'Aguardando Envio' },
  { key: 'IN_WARRANTY', label: 'Em Garantia' },
  { key: 'COMPLETED', label: 'Concluído' },
  { key: 'DISPUTED', label: 'Em Disputa' }
];

export default function KanbanBoard() {
  const [chats, setChats] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    const res = await fetch('/api/chats/mine');
    if (res.ok) setChats(await res.json());
  }

  async function moveChat(protocol, status) {
    setChats(prev => prev.map(c => (c.protocol === protocol ? { ...c, status } : c)));
    await fetch(`/api/chats/${protocol}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }

  function handleDrop(columnKey) {
    if (draggingId) moveChat(draggingId, columnKey);
    setDraggingId(null);
  }

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: 16 }}>
      {COLUMNS.map(col => (
        <div
          key={col.key}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
          style={{
            minWidth: 260,
            background: 'var(--da-surface)',
            borderRadius: 'var(--da-radius)',
            border: '1px solid var(--da-border)',
            padding: 12
          }}
        >
          <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--da-primary)' }}>{col.label}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chats.filter(c => c.status === col.key).map(chat => (
              <div
                key={chat.id}
                draggable
                onDragStart={() => setDraggingId(chat.protocol)}
                className="da-card"
                style={{ cursor: 'grab', padding: 10 }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{chat.protocol}</div>
                <div style={{ fontSize: 12, color: 'var(--da-text-muted)' }}>
                  {chat.order?.amount ? `R$ ${Number(chat.order.amount).toFixed(2)}` : ''}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {chat.messages?.[0]?.content?.slice(0, 40) || 'Sem mensagens ainda'}
                </div>
                <Link
                  to={`/loja/chats/${chat.protocol}`}
                  style={{ fontSize: 12, color: 'var(--da-primary)', display: 'inline-block', marginTop: 6 }}
                >
                  Abrir conversa
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
