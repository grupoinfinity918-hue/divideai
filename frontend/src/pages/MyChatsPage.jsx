import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader, useAuth } from '../context/AuthContext';

export default function MyChatsPage() {
  const { refreshUnread } = useAuth();
  const [sales, setSales] = useState([]);
  const [presale, setPresale] = useState([]);
  const [support, setSupport] = useState([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [s, p, sup] = await Promise.all([
      fetch('/api/chats/mine', { headers: authHeader() }).then(r => r.json()),
      fetch('/api/presale-chats/mine', { headers: authHeader() }).then(r => r.json()),
      fetch('/api/support-chats/mine', { headers: authHeader() }).then(r => r.json())
    ]);
    setSales(Array.isArray(s) ? s : []);
    setPresale(Array.isArray(p) ? p : []);
    setSupport(Array.isArray(sup) ? sup : []);
    refreshUnread();
  }

  const items = [
    ...sales.map(c => ({
      id: c.protocol,
      href: `/chat-venda/${c.protocol}`,
      title: `Venda #${c.order?.protocol || c.protocol}`,
      subtitle: c.messages?.[0]?.content || 'Sem mensagens ainda',
      unread: c.unreadCount || 0,
      kind: 'venda'
    })),
    ...presale.map(c => ({
      id: c.id,
      href: `/chat-duvidas/${c.id}`,
      title: c.listing?.title || 'Dúvida sobre produto',
      subtitle: c.messages?.[0]?.content || 'Sem mensagens ainda',
      unread: c.unreadCount || 0,
      kind: 'duvida'
    })),
    ...support.map(c => ({
      id: c.id,
      href: `/suporte/${c.id}`,
      title: 'Suporte Divide Aí',
      subtitle: c.messages?.[0]?.content || 'Sem mensagens ainda',
      unread: c.unreadCount || 0,
      kind: 'suporte'
    }))
  ];

  const filtered = tab === 'all' ? items : items.filter(i => i.kind === tab);

  const TABS = [
    { key: 'all', label: 'Todos' },
    { key: 'venda', label: 'Vendas' },
    { key: 'duvida', label: 'Dúvidas' },
    { key: 'suporte', label: 'Suporte' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Chats</h1>

        <div className="flex gap-2 border-b border-pink-100 mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key ? 'border-pink-neon text-pink-neon' : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className="card p-4 flex items-center justify-between hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
              </div>
              {item.unread > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  {item.unread > 9 ? '9+' : item.unread}
                </span>
              )}
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-400">Nenhuma conversa aqui ainda.</p>}
        </div>
      </main>
    </div>
  );
}
