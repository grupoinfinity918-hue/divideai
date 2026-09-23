import { useEffect, useState } from 'react';

export default function ChatMonitoring() {
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    const res = await fetch('/api/admin/chats');
    if (res.ok) setChats(await res.json());
  }

  async function openChat(protocol) {
    const res = await fetch(`/api/chats/${protocol}`);
    if (res.ok) setActiveChat(await res.json());
  }

  async function enterTripartite(protocol) {
    await fetch(`/api/chats/${protocol}/tripartite`, { method: 'POST' });
    openChat(protocol);
  }

  async function sendSupportMessage() {
    if (!input.trim() || !activeChat) return;
    await fetch(`/api/chats/${activeChat.protocol}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input })
    });
    setInput('');
    openChat(activeChat.protocol);
  }

  const filtered = chats.filter(c => c.protocol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="da-container" style={{ paddingTop: 24, display: 'flex', gap: 20 }}>
      <div style={{ width: 300 }}>
        <h2 style={{ fontSize: 18 }}>Monitoria de Chats</h2>
        <input
          placeholder="Buscar por protocolo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)', marginBottom: 12 }}
        />
        <div style={{ display: 'grid', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
          {filtered.map(chat => (
            <div key={chat.id} className="da-card" style={{ padding: 10, cursor: 'pointer' }} onClick={() => openChat(chat.protocol)}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{chat.protocol}</div>
              <div style={{ fontSize: 12, color: 'var(--da-text-muted)' }}>Status: {chat.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {activeChat ? (
          <div className="da-card" style={{ height: 560, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{activeChat.protocol} {activeChat.tripartite && '— Tripartite'}</h3>
              {!activeChat.tripartite && (
                <button className="da-btn" onClick={() => enterTripartite(activeChat.protocol)}>
                  Entrar na conversa (Tripartite)
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {activeChat.messages?.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.senderType === 'SUPPORT' ? 'center' : m.senderType === 'CLIENT' ? 'flex-start' : 'flex-end',
                  background: m.senderType === 'SUPPORT' ? '#ffe9f1' : '#fff',
                  border: '1px solid var(--da-border)',
                  borderRadius: 10,
                  padding: '6px 10px',
                  fontSize: 13,
                  maxWidth: '80%'
                }}>
                  <strong style={{ fontSize: 11, color: 'var(--da-text-muted)' }}>{m.senderType}</strong>
                  <div>{m.content}</div>
                </div>
              ))}
            </div>
            {activeChat.tripartite && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Mensagem do suporte..."
                  style={{ flex: 1, padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
                />
                <button className="da-btn" onClick={sendSupportMessage}>Enviar</button>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--da-text-muted)' }}>Selecione um protocolo para visualizar a conversa.</p>
        )}
      </div>
    </div>
  );
}
