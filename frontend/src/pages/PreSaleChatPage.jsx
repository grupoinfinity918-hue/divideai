import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader } from '../context/AuthContext';

export default function PreSaleChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const res = await fetch(`/api/presale-chats/${id}`, { headers: authHeader() });
    if (res.ok) setChat(await res.json());
  }

  async function send() {
    if (!input.trim()) return;
    await fetch(`/api/presale-chats/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ content: input })
    });
    setInput('');
    load();
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <p className="max-w-lg mx-auto px-4 pt-10 text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-8 pb-16">
        <div className="card p-5 h-[520px] flex flex-col">
          <h1 className="font-bold text-gray-900 mb-1">{chat.listing?.title}</h1>
          <p className="text-xs text-gray-400 mb-3">Protocolo: {chat.protocol}</p>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {chat.messages?.map(m => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.senderType === 'CLIENT'
                    ? 'self-end bg-pink-neon text-white'
                    : 'self-start bg-pink-soft text-gray-800'
                }`}
              >
                {m.content}
              </div>
            ))}
            {chat.messages?.length === 0 && (
              <p className="text-sm text-gray-400">Envie sua dúvida sobre este produto.</p>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-pink-100 rounded-xl px-3 py-2 text-sm"
            />
            <button onClick={send} className="btn-primary text-sm">Enviar</button>
          </div>
        </div>
      </main>
    </div>
  );
}
