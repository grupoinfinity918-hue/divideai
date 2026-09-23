import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function ChatMonitoring() {
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    const res = await fetch('/api/admin/chats', { headers: authHeader() });
    if (res.ok) setChats(await res.json());
  }

  async function openChat(protocol) {
    const res = await fetch(`/api/chats/${protocol}`, { headers: authHeader() });
    if (res.ok) setActiveChat(await res.json());
  }

  async function enterTripartite(protocol) {
    await fetch(`/api/chats/${protocol}/tripartite`, { method: 'POST', headers: authHeader() });
    openChat(protocol);
  }

  async function sendSupportMessage() {
    if (!input.trim() || !activeChat) return;
    await fetch(`/api/chats/${activeChat.protocol}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ content: input })
    });
    setInput('');
    openChat(activeChat.protocol);
  }

  const filtered = chats.filter(c => c.protocol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Monitoria de Chats</h2>
      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0">
          <input
            placeholder="Buscar por protocolo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-pink-100 rounded-xl px-3 py-2 mb-3 text-sm"
          />
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {filtered.map(chat => (
              <div
                key={chat.id}
                onClick={() => openChat(chat.protocol)}
                className="card p-3 cursor-pointer"
              >
                <p className="font-bold text-sm">{chat.protocol}</p>
                <p className="text-xs text-gray-500">Status: {chat.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeChat ? (
            <div className="card p-5 h-[560px] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">{activeChat.protocol} {activeChat.tripartite && '— Tripartite'}</h3>
                {!activeChat.tripartite && (
                  <button className="btn-primary text-sm" onClick={() => enterTripartite(activeChat.protocol)}>
                    Entrar na conversa (Tripartite)
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {activeChat.messages?.map(m => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm border border-pink-100 ${
                      m.senderType === 'SUPPORT'
                        ? 'self-center bg-pink-soft'
                        : m.senderType === 'CLIENT'
                        ? 'self-start bg-white'
                        : 'self-end bg-white'
                    }`}
                  >
                    <span className="block text-[11px] text-gray-400 font-semibold">{m.senderType}</span>
                    {m.content}
                  </div>
                ))}
              </div>
              {activeChat.tripartite && (
                <div className="flex gap-2 mt-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Mensagem do suporte..."
                    className="flex-1 border border-pink-100 rounded-xl px-3 py-2 text-sm"
                  />
                  <button className="btn-primary text-sm" onClick={sendSupportMessage}>Enviar</button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Selecione um protocolo para visualizar a conversa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
