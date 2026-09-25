import { useNavigate, Link } from 'react-router-dom';

export const ICON_MAP = {
  tv: '📺',
  filme: '🎬',
  jogo: '🎮',
  bola: '⚽',
  musica: '🎵',
  ia: '🤖',
  livro: '📚',
  outro: '⭐'
};

export default function ProductCard({ item }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/produto/${item.id}`)}
      className="card p-6 flex flex-col items-center text-center cursor-pointer relative hover:-translate-y-0.5 transition-transform"
    >
      {item.isPrioritario && (
        <span className="absolute top-3 right-3 text-[10px] font-bold text-pink-neon bg-pink-soft px-2 py-1 rounded-full">
          Destaque
        </span>
      )}

      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-neon to-pink-light flex items-center justify-center text-2xl mb-3">
        {ICON_MAP[item.icon] || ICON_MAP.tv}
      </div>

      <h3 className="font-bold text-gray-900">{item.title}</h3>

      {item.origin === 'OWN' ? (
        <span className="text-xs text-pink-neon font-semibold mt-1">Produto oficial Divide Aí</span>
      ) : (
        <Link to={`/loja/${item.sellerId}`} onClick={e => e.stopPropagation()} className="mt-2 inline-flex items-center justify-center rounded-xl border border-pink-200 bg-white px-4 py-2 text-xs font-black text-pink-neon shadow-sm hover:bg-pink-soft transition">🏪 Visualizar Loja</Link>
      )}

      <p className="text-sm text-gray-500 mt-2">
        {item.slotsAvailable == null ? <span className="font-bold text-gray-800">Disponível</span> : <><span className="font-bold text-gray-800">{item.slotsAvailable}</span> Vagas</>}
      </p>

      <p className="mt-1">
        <span className="text-xl font-extrabold text-pink-neon">R$ {Number(item.price).toFixed(2)}</span>{' '}
        <span className="text-xs text-gray-400">/{item.billingPeriod || 'mensal'}</span>
      </p>

      <span className="mt-4 text-xs font-semibold text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
        {item.slotsAvailable == null || item.slotsAvailable > 0 ? 'Disponível para assinatura' : 'Sem vagas no momento'}
      </span>
    </div>
  );
}
