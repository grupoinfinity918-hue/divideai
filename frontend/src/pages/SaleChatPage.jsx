import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader, useAuth } from '../context/AuthContext';

function Avatar({ user, size = 8 }) {
  const cls = `w-${size} h-${size} rounded-full object-cover flex-shrink-0`;
  return user?.avatarUrl ? (
    <img src={user.avatarUrl} className={cls} />
  ) : (
    <span className={`${cls} bg-pink-soft flex items-center justify-center text-pink-neon text-xs font-bold`}>
      {user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

export default function SaleChatPage() {
  const { protocol } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    load();
  }, [protocol]);

  async function load() {
    const res = await fetch(`/api/chats/${protocol}`, { headers: authHeader() });
    if (res.ok) setChat(await res.json());
  }

  async function send() {
    if (!input.trim()) return;
    await fetch(`/api/chats/${protocol}/messages`, {
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
        <div className="card p-5 h-[560px] flex flex-col">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-pink-100">
            <div className="flex -space-x-2">
              <Avatar user={chat.client} />
              <Avatar user={chat.seller} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">
                {chat.client?.name} & {chat.seller?.name} {chat.tripartite && '— Tripartite'}
              </h1>
              <p className="text-xs text-gray-400">Protocolo: {chat.protocol}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {chat.messages?.map(m => {
              const isMe = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {m.senderType !== 'SUPPORT' && <Avatar user={m.sender} size={6} />}
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      m.senderType === 'SUPPORT' ? 'bg-pink-soft text-gray-800 mx-auto' : isMe ? 'bg-pink-neon text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {m.senderType === 'SUPPORT' && <span className="block text-[10px] font-bold text-gray-400">SUPORTE</span>}
                    {m.content}
                  </div>
                </div>
              );
            })}
            {chat.messages?.length === 0 && <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>}
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
