import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';

const CONFIG = {
  proprias: { origin: 'OWN', title: 'Assine com o Divide Aí' },
  marketplace: { origin: 'THIRD_PARTY', title: 'Divide Aí com a Galera' }
};

export default function ShowcaseFull() {
  const { tipo } = useParams();
  const config = CONFIG[tipo] || CONFIG.marketplace;
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch(`/api/listings?origin=${config.origin}`)
      .then(r => r.json())
      .then(setListings)
      .catch(() => {});
  }, [tipo]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{config.title}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {listings.map(item => (
            <div key={item.id} className="card p-5 flex flex-col relative">
              {item.isPrioritario && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-pink-neon bg-pink-soft px-2 py-1 rounded-full">
                  Destaque
                </span>
              )}
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-2xl font-extrabold text-pink-neon">
                  R$ {Number(item.price).toFixed(2)}
                </span>
                <button className="btn-primary text-sm">Adquirir Tela</button>
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full">Nenhum anúncio disponível no momento.</p>
          )}
        </div>
      </main>
    </div>
  );
}
