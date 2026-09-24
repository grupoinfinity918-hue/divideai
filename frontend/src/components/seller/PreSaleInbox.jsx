import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authHeader } from '../../context/AuthContext';

export default function PreSaleInbox() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetch('/api/presale-chats/mine', { headers: authHeader() })
      .then(r => r.json())
      .then(setChats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-2 max-w-xl">
      {chats.map(chat => (
        <Link
          key={chat.id}
          to={`/chat-duvidas/${chat.id}`}
          className="card p-4 flex items-center justify-between hover:shadow-md"
        >
          <div>
            <p className="font-semibold text-sm">{chat.listing?.title}</p>
            <p className="text-xs text-gray-500">{chat.messages?.[0]?.content?.slice(0, 50) || 'Sem mensagens ainda'}</p>
          </div>
          <span className="text-xs text-gray-400">{chat.protocol}</span>
        </Link>
      ))}
      {chats.length === 0 && <p className="text-sm text-gray-400">Nenhuma dúvida recebida ainda.</p>}
    </div>
  );
}
