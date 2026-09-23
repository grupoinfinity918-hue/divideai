import { useEffect, useState } from 'react';

export default function StoreSettings() {
  const [profile, setProfile] = useState({ name: '', phone: '', photoUrl: '', description: '' });
  const [listings, setListings] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    loadListings();
  }, []);

  async function loadProfile() {
    const res = await fetch('/api/seller/profile');
    if (res.ok) setProfile(await res.json());
  }

  async function loadListings() {
    const res = await fetch('/api/seller/listings');
    if (res.ok) setListings(await res.json());
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/seller/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    setSaving(false);
  }

  return (
    <div className="da-container" style={{ paddingTop: 24 }}>
      <h2>Configurações da Loja</h2>

      <form onSubmit={saveProfile} className="da-card" style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <label>
          Foto da loja (URL)
          <input
            value={profile.photoUrl || ''}
            onChange={e => setProfile({ ...profile, photoUrl: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
          />
        </label>
        <label>
          Nome da loja
          <input
            value={profile.name || ''}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
          />
        </label>
        <label>
          Descrição
          <textarea
            value={profile.description || ''}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
            rows={4}
            style={{ width: '100%', padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
          />
        </label>
        <label>
          Telefone (WhatsApp)
          <input
            value={profile.phone || ''}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
          />
        </label>
        <button className="da-btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>

      <h3 style={{ marginTop: 32 }}>Meus Anúncios</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {listings.map(item => (
          <div key={item.id} className="da-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--da-text-muted)' }}>Status: {item.status}</div>
            </div>
            <a href={`/loja/anuncios/${item.id}/editar`} className="da-btn da-btn-outline">Editar</a>
          </div>
        ))}
      </div>
    </div>
  );
}
