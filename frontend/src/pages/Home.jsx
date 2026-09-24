import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import ProductCard from '../components/common/ProductCard';
import FloatingAIChat from '../components/common/FloatingAIChat';
import { applyTheme } from '../services/themeRegistry';

function Showcase({ title, data, seeMoreHref }) {
  return (
    <section className="pt-10 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Link to={seeMoreHref} className="btn-outline text-sm">Ver Mais</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {data.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full">Nenhum anúncio disponível no momento.</p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [settings, setSettings] = useState({ aiChatEnabled: true, homepageOrder: ['OWN', 'THIRD_PARTY'] });
  const [ownListings, setOwnListings] = useState([]);
  const [thirdPartyListings, setThirdPartyListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  useEffect(() => {
    loadListings('OWN', setOwnListings, activeCategory);
    loadListings('THIRD_PARTY', setThirdPartyListings, activeCategory);
  }, [activeCategory]);

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

  async function loadListings(origin, setter, categorySlug) {
    const params = new URLSearchParams({ origin });
    if (!categorySlug) {
      params.set('featured', 'true');
      params.set('limit', '8');
    } else {
      params.set('category', categorySlug);
    }
    const res = await fetch(`/api/listings?${params.toString()}`);
    if (res.ok) setter(await res.json());
  }

  const sections = {
    OWN: { title: 'Assine com o Divide Aí', data: ownListings, href: '/vitrine/proprias' },
    THIRD_PARTY: { title: 'Divide Aí com a Galera', data: thirdPartyListings, href: '/vitrine/marketplace' }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4">
        <section className="pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-pink-neon to-pink-light h-40 md:h-56" />
        </section>

        <section className="pt-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={!activeCategory ? 'btn-primary text-sm whitespace-nowrap' : 'btn-outline text-sm whitespace-nowrap'}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={activeCategory === cat.slug ? 'btn-primary text-sm whitespace-nowrap' : 'btn-outline text-sm whitespace-nowrap'}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {settings.homepageOrder.map(key => (
          <Showcase
            key={key}
            title={sections[key].title}
            data={sections[key].data}
            seeMoreHref={activeCategory ? `/vitrine/${key === 'OWN' ? 'proprias' : 'marketplace'}?categoria=${activeCategory}` : sections[key].href}
          />
        ))}
      </main>

      <FloatingAIChat enabled={settings.aiChatEnabled} />
    </div>
  );
}
