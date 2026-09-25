import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/common/Header';
import ReportModal from '../components/common/ReportModal';
import { useAuth, authHeader } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [platformRules, setPlatformRules] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/listings/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]).then(([listing, settings]) => { setItem(listing); setPlatformRules(settings.platformRules || ''); }).catch(() => {});
  }, [id]);

  async function handleBuy() {
    if (!isAuthenticated) return navigate('/login');
    setLoading(true);
    setError('');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ listingId: id })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) navigate(`/checkout/${data.id}`);
    else setError(data.error || 'Não foi possível iniciar a compra');
  }

  async function handleChat() {
    if (!isAuthenticated) return navigate('/login');
    const res = await fetch('/api/presale-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ listingId: id })
    });
    const data = await res.json();
    if (res.ok) navigate(`/chat-duvidas/${data.id}`);
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <p className="max-w-3xl mx-auto px-4 pt-10 text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <div className="card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-neon to-pink-light flex items-center justify-center text-2xl">
              🎬
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              <p className="text-sm text-gray-500">{item.origin === 'OWN' ? 'Produto oficial Divide Aí' : `Vendido por ${item.seller?.name}`} · {item.category?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <span className="text-3xl font-extrabold text-pink-neon">
              R$ {Number(item.price).toFixed(2)} <span className="text-sm text-gray-400 font-normal">/{item.billingPeriod}</span>
            </span>
            <span className="text-sm font-semibold text-gray-600 bg-pink-soft px-3 py-1 rounded-full">
              {item.slotsAvailable == null ? 'Disponível' : `${item.slotsAvailable} de ${item.slotsTotal} vagas disponíveis`}
            </span>
          </div>

          <h2 className="font-bold text-gray-900 mb-2">Descrição</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line mb-6">{item.description}</p>

          {item.rules && (
            <>
              <h2 className="font-bold text-gray-900 mb-2">{item.origin === 'OWN' ? 'Regras deste produto' : 'Regras do vendedor'}</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line mb-6">{item.rules}</p>
            </>
          )}

          {platformRules && (
            <div className="rounded-2xl bg-pink-soft border border-pink-100 p-5 mb-6">
              <h2 className="font-bold text-gray-900 mb-2">Regras gerais da plataforma</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{platformRules}</p>
            </div>
          )}

          {error && <p className="text-sm text-pink-dark mb-4">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button onClick={handleBuy} className="btn-primary" disabled={loading || (item.slotsAvailable !== null && item.slotsAvailable <= 0)}>
              {loading ? 'Aguarde...' : (item.slotsAvailable === null || item.slotsAvailable > 0) ? 'Adquirir' : 'Sem vagas'}
            </button>
            <button onClick={handleChat} className="btn-outline">Chat com o Vendedor</button>
            <button
              onClick={() => setShowReport(true)}
              className="text-sm text-gray-400 hover:text-pink-dark px-4 py-2"
            >
              Denunciar anúncio
            </button>
          </div>
        </div>
      </main>

      {showReport && (
        <ReportModal
          targetType="LISTING"
          targetId={item.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
