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
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="card w-80 max-w-[85vw] h-[420px] flex flex-col p-4 mb-3">
          <div className="font-bold text-pink-neon mb-2">Assistente Divide Aí</div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'self-end bg-pink-neon text-white'
                    : 'self-start bg-white border border-pink-100 text-gray-800'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">digitando...</div>}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua dúvida..."
              className="flex-1 rounded-xl border border-pink-100 px-3 py-2 text-sm"
            />
            <button className="btn-primary text-sm" onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-primary rounded-full w-14 h-14 text-xl shadow-lg"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}
