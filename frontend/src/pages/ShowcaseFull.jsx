import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import ProductCard from '../components/common/ProductCard';

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
            <ProductCard key={item.id} item={item} />
          ))}
          {listings.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full">Nenhum anúncio disponível no momento.</p>
          )}
        </div>
      </main>
    </div>
  );
}
