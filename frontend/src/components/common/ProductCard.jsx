import { useNavigate } from 'react-router-dom';

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
        🎬
      </div>

      <h3 className="font-bold text-gray-900">{item.title}</h3>

      <p className="text-sm text-gray-500 mt-2">
        <span className="font-bold text-gray-800">{item.slotsAvailable ?? item.slotsTotal ?? '-'}</span> Vagas
      </p>

      <p className="mt-1">
        <span className="text-xl font-extrabold text-pink-neon">R$ {Number(item.price).toFixed(2)}</span>{' '}
        <span className="text-xs text-gray-400">/{item.billingPeriod || 'mensal'}</span>
      </p>

      <span className="mt-4 text-xs font-semibold text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
        {item.slotsAvailable > 0 ? `Assinado, com vagas` : 'Sem vagas no momento'}
      </span>
    </div>
  );
}
