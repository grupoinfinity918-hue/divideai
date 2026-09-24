import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import ProductCard from '../components/common/ProductCard';

export default function SellerStorePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/sellers/${id}/store`).then(r => r.json()).then(setData).catch(() => {});
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <p className="max-w-3xl mx-auto px-4 pt-10 text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  const { seller, listings, reviews, ratingAverage, ratingCount } = data;
  const accent = seller.storeColor || '#ec1c6a';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div
        className="h-32 md:h-44"
        style={{
          background: seller.storeBannerUrl ? `url(${seller.storeBannerUrl}) center/cover` : `linear-gradient(135deg, ${accent}, #ffffff)`
        }}
      />
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-4 -mt-10 mb-8">
          {seller.avatarUrl ? (
            <img src={seller.avatarUrl} className="w-20 h-20 rounded-full border-4 border-white object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white bg-pink-soft flex items-center justify-center text-2xl font-bold text-pink-neon">
              {seller.name?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{seller.storeName || seller.name}</h1>
            {ratingCount > 0 ? (
              <p className="text-sm text-gray-500">⭐ {ratingAverage.toFixed(1)} ({ratingCount} avaliações)</p>
            ) : (
              <p className="text-sm text-gray-400">Ainda sem avaliações</p>
            )}
          </div>
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Produtos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
          {listings.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
          {listings.length === 0 && <p className="text-sm text-gray-400 col-span-full">Nenhum produto ativo.</p>}
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Avaliações</h2>
        <div className="flex flex-col gap-3 max-w-2xl">
          {reviews.map(r => (
            <div key={r.id} className="card p-4">
              <p className="text-sm font-semibold">{'⭐'.repeat(r.stars)} — {r.author?.name}</p>
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-gray-400">Nenhuma avaliação ainda.</p>}
        </div>
      </main>
    </div>
  );
}
