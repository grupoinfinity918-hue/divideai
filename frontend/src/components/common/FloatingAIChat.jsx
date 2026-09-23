import { useState } from 'react';

export default function FloatingAIChat({ enabled = true }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Oi! Sou o assistente do Divide Aí. Posso tirar dúvidas sobre como o site funciona.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/institutional-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui responder agora, tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100 }}>
      {open && (
        <div className="da-card" style={{
          width: 320,
          maxWidth: '85vw',
          height: 420,
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 12
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--da-primary)' }}>
            Assistente Divide Aí
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? 'var(--da-primary)' : '#fff',
                  color: m.role === 'user' ? '#fff' : 'var(--da-text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--da-border)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  maxWidth: '85%',
                  fontSize: 14
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && <div style={{ fontSize: 13, color: 'var(--da-text-muted)' }}>digitando...</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua dúvida..."
              style={{
                flex: 1,
                borderRadius: 'var(--da-radius-sm)',
                border: '1px solid var(--da-border)',
                padding: '8px 10px'
              }}
            />
            <button className="da-btn" onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="da-btn"
        style={{
          borderRadius: '50%',
          width: 56,
          height: 56,
          fontSize: 22,
          boxShadow: 'var(--da-shadow)'
        }}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}
