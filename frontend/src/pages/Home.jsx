import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Banner from '../components/common/Banner';
import FloatingAIChat from '../components/common/FloatingAIChat';
import { applyTheme } from '../services/themeRegistry';

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
    OWN: {
      title: 'Assine com o Divide Aí',
      data: ownListings
    },
    THIRD_PARTY: {
      title: 'Contas de Clientes',
      data: thirdPartyListings
    }
  };

  return (
    <div>
      <Header />
      <Banner />

      <section className="da-container" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Categorias</h2>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
          {categories.map(cat => (
            <button key={cat.id} className="da-btn da-btn-outline" style={{ whiteSpace: 'nowrap' }}>
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {settings.homepageOrder.map(key => (
        <section key={key} className="da-container" style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>{sections[key].title}</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16
          }}>
            {sections[key].data.map(item => (
              <div key={item.id} className="da-card">
                <h3 style={{ fontSize: 15, margin: '0 0 6px' }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--da-text-muted)', margin: '0 0 10px' }}>
                  {item.description?.slice(0, 60)}...
                </p>
                <strong style={{ color: 'var(--da-primary)' }}>R$ {Number(item.price).toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </section>
      ))}

      <FloatingAIChat enabled={settings.aiChatEnabled} />
    </div>
  );
}
