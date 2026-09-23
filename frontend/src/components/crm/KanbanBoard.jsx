import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

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
    const res = await fetch('/api/chats/mine', { headers: authHeader() });
    if (res.ok) setChats(await res.json());
  }

  async function moveChat(protocol, status) {
    setChats(prev => prev.map(c => (c.protocol === protocol ? { ...c, status } : c)));
    await fetch(`/api/chats/${protocol}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ status })
    });
  }

  function handleDrop(columnKey) {
    if (draggingId) moveChat(draggingId, columnKey);
    setDraggingId(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map(col => (
        <div
          key={col.key}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
          className="min-w-[260px] bg-pink-soft border border-pink-100 rounded-2xl p-3"
        >
          <h3 className="text-sm font-bold text-pink-neon mb-3">{col.label}</h3>
          <div className="flex flex-col gap-3">
            {chats.filter(c => c.status === col.key).map(chat => (
              <div
                key={chat.id}
                draggable
                onDragStart={() => setDraggingId(chat.protocol)}
                className="card p-3 cursor-grab"
              >
                <div className="font-bold text-sm">{chat.protocol}</div>
                <div className="text-xs text-gray-500">
                  {chat.order?.amount ? `R$ ${Number(chat.order.amount).toFixed(2)}` : ''}
                </div>
                <div className="text-xs mt-1 text-gray-600">
                  {chat.messages?.[0]?.content?.slice(0, 40) || 'Sem mensagens ainda'}
                </div>
              </div>
            ))}
            {chats.filter(c => c.status === col.key).length === 0 && (
              <p className="text-xs text-gray-400">Nenhum atendimento aqui.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
