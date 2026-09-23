import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import FloatingAIChat from '../components/common/FloatingAIChat';
import { applyTheme } from '../services/themeRegistry';

function ProductCard({ item }) {
  return (
    <div className="card p-5 flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-2xl font-extrabold text-pink-neon">
          R$ {Number(item.price).toFixed(2)}
        </span>
        <button className="btn-primary text-sm">Adquirir Tela</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState({ aiChatEnabled: true, homepageOrder: ['OWN', 'THIRD_PARTY'] });
  const [ownListings, setOwnListings] = useState([]);
  const [thirdPartyListings, setThirdPartyListings] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadSettings();
    loadCategories();
    loadListings('OWN', setOwnListings);
    loadListings('THIRD_PARTY', setThirdPartyListings);
  }, []);

  async function loadSettings() {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      applyTheme(data.activeTheme);
    }
  }

  async function loadCategories() {
    const res = await fetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  }

  async function loadListings(origin, setter) {
    const res = await fetch(`/api/listings?origin=${origin}`);
    if (res.ok) setter(await res.json());
  }

  const sections = {
    OWN: { title: 'Assine com o Divide Aí', data: ownListings },
    THIRD_PARTY: { title: 'Divide Aí com a Galera', data: thirdPartyListings }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4">
        <section className="pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-pink-neon to-pink-light p-8 md:p-12 text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold">
              Assinaturas e contas com garantia de 15 dias
            </h1>
            <p className="mt-2 text-white/90 text-sm md:text-lg">
              Compre e venda com segurança no Divide Aí
            </p>
          </div>
        </section>

        <section className="pt-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button key={cat.id} className="btn-outline text-sm whitespace-nowrap">
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {settings.homepageOrder.map(key => (
          <section key={key} className="pt-10 pb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-5">{sections[key].title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sections[key].data.map(item => (
                <ProductCard key={item.id} item={item} />
              ))}
              {sections[key].data.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">Nenhum anúncio disponível no momento.</p>
              )}
            </div>
          </section>
        ))}
      </main>

      <FloatingAIChat enabled={settings.aiChatEnabled} />
    </div>
  );
}
