import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, authHeader } from '../../context/AuthContext';

export default function FloatingAIChat({ enabled = true }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Oi! Sou o assistente do Divide Aí. Posso tirar dúvidas sobre como o site funciona.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  async function sendAIMessage() {
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

  async function startSupportChat() {
    if (!isAuthenticated) {
      setOpen(false);
      navigate('/login');
      return;
    }
    const res = await fetch('/api/support-chats', { method: 'POST', headers: authHeader() });
    if (res.ok) {
      const chat = await res.json();
      setOpen(false);
      navigate(`/suporte/${chat.id}`);
    }
  }

  function closeAndReset() {
    setOpen(false);
    setMode(null);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="card w-80 max-w-[85vw] h-[420px] flex flex-col p-4 mb-3">
          {!mode && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <p className="font-bold text-gray-900">Como podemos ajudar?</p>
              <button onClick={startSupportChat} className="btn-outline w-full text-sm">
                Falar e aguardar o suporte
              </button>
              <button onClick={() => setMode('ai')} className="btn-primary w-full text-sm">
                Falar agora com a IA
              </button>
            </div>
          )}

          {mode === 'ai' && (
            <>
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
                  onKeyDown={e => e.key === 'Enter' && sendAIMessage()}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 rounded-xl border border-pink-100 px-3 py-2 text-sm"
                />
                <button className="btn-primary text-sm" onClick={sendAIMessage}>Enviar</button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => (open ? closeAndReset() : setOpen(true))}
        className="btn-primary rounded-full w-14 h-14 text-xl shadow-lg"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}
