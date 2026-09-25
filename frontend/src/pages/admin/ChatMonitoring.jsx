import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

const KIND_LABEL = { VENDA: 'Venda', DUVIDA: 'Dúvida', SUPORTE: 'Suporte' };
const KIND_ENDPOINT = { VENDA: id => `/api/chats/${id}`, DUVIDA: id => `/api/presale-chats/${id}`, SUPORTE: id => `/api/support-chats/${id}` };

export default function ChatMonitoring() {
  const [search, setSearch] = useState('');
  const [all, setAll] = useState({ sales: [], presale: [], support: [] });
  const [activeChat, setActiveChat] = useState(null);
  const [activeKind, setActiveKind] = useState(null);
  const [activeRealId, setActiveRealId] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    const res = await fetch('/api/admin/chats-all', { headers: authHeader() });
    if (res.ok) setAll(await res.json());
  }

  async function openChat(kind, realId, byProtocolPath) {
    const url = kind === 'VENDA' ? `/api/chats/${byProtocolPath}` : KIND_ENDPOINT[kind](realId);
    const res = await fetch(url, { headers: authHeader() });
    if (res.ok) {
      setActiveChat(await res.json());
      setActiveKind(kind);
      setActiveRealId(kind === 'VENDA' ? byProtocolPath : realId);
    }
  }

  async function enterTripartite(protocol) {
    await fetch(`/api/chats/${protocol}/tripartite`, { method: 'POST', headers: authHeader() });
    openChat('VENDA', null, protocol);
  }

  async function sendMessage() {
    if (!input.trim() || !activeChat) return;
    const endpoint =
      activeKind === 'VENDA' ? `/api/chats/${activeChat.protocol}/messages` :
      activeKind === 'DUVIDA' ? `/api/presale-chats/${activeRealId}/messages` :
      `/api/support-chats/${activeRealId}/messages`;

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ content: input })
    });
    setInput('');
    openChat(activeKind, activeRealId, activeChat.protocol);
  }

  const items = [
    ...all.sales.map(c => ({ ...c, kind: 'VENDA', people: `${c.client} / ${c.seller}` })),
    ...all.presale.map(c => ({ ...c, kind: 'DUVIDA', people: `${c.client} / ${c.seller}` })),
    ...all.support.map(c => ({ ...c, kind: 'SUPORTE', people: c.user }))
  ].filter(c => c.protocol.toLowerCase().includes(search.toLowerCase()) || c.people?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Monitoria de Chats</h2>
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0">
          <input
            placeholder="Buscar por protocolo ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-pink-100 rounded-xl px-3 py-2 mb-3 text-sm"
          />
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {items.map(chat => (
              <div
                key={chat.id}
                onClick={() => openChat(chat.kind, chat.id, chat.protocol)}
                className="card p-3 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm">{chat.protocol}</p>
                  <span className="text-[10px] font-bold text-pink-neon bg-pink-soft px-2 py-0.5 rounded-full">
                    {KIND_LABEL[chat.kind]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{chat.people}</p>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-400">Nenhum chat encontrado.</p>}
          </div>
        </div>

        <div className="flex-1">
          {activeChat ? (
            <div className="card p-5 h-[560px] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">{activeChat.protocol} — {KIND_LABEL[activeKind]}</h3>
                {activeKind === 'VENDA' && !activeChat.tripartite && (
                  <button className="btn-primary text-sm" onClick={() => enterTripartite(activeChat.protocol)}>
                    Entrar na conversa (Tripartite)
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {activeChat.messages?.map(m => (
                  <div key={m.id} className="flex items-end gap-2">
                    {m.senderType !== 'SUPPORT' && (
                      m.sender?.avatarUrl ? (
                        <img src={m.sender.avatarUrl} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-pink-soft flex items-center justify-center text-pink-neon text-[10px] font-bold flex-shrink-0">
                          {m.sender?.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm border border-pink-100 ${
                        m.senderType === 'SUPPORT' ? 'mx-auto bg-pink-soft' : m.senderType === 'CLIENT' ? 'bg-white' : 'bg-white'
                      }`}
                    >
                      <span className="block text-[11px] text-gray-400 font-semibold">{m.sender?.name || m.senderType}</span>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Mensagem do suporte..."
                  className="flex-1 border border-pink-100 rounded-xl px-3 py-2 text-sm"
                />
                <button className="btn-primary text-sm" onClick={sendMessage}>Enviar</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Selecione um protocolo para visualizar a conversa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
