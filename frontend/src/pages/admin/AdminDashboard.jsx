import { useEffect, useState } from 'react';
import ThemeSelector from '../../components/admin/ThemeSelector';

export default function AdminDashboard() {
  const [settings, setSettings] = useState({ aiChatEnabled: true, activeTheme: 'DEFAULT' });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const res = await fetch('/api/settings');
    if (res.ok) setSettings(await res.json());
  }

  async function toggleAI() {
    const next = !settings.aiChatEnabled;
    setSettings(prev => ({ ...prev, aiChatEnabled: next }));
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiChatEnabled: next })
    });
  }

  return (
    <div className="da-container" style={{ paddingTop: 24, display: 'grid', gap: 20 }}>
      <h2>Painel do Administrador</h2>

      <div className="da-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480 }}>
        <div>
          <strong>Assistente de IA Institucional</strong>
          <p style={{ fontSize: 13, color: 'var(--da-text-muted)', margin: '4px 0 0' }}>
            Chat flutuante de dúvidas na Home
          </p>
        </div>
        <button
          onClick={toggleAI}
          className="da-btn"
          style={{ background: settings.aiChatEnabled ? 'var(--da-primary)' : '#ccc' }}
        >
          {settings.aiChatEnabled ? 'Ligado' : 'Desligado'}
        </button>
      </div>

      <ThemeSelector
        activeTheme={settings.activeTheme}
        onChange={key => setSettings(prev => ({ ...prev, activeTheme: key }))}
      />

      <div style={{ display: 'flex', gap: 12 }}>
        <a href="/admin/chats" className="da-btn da-btn-outline">Monitoria de Chats</a>
        <a href="/admin/anuncios/aprovacao" className="da-btn da-btn-outline">Aprovação de Anúncios</a>
      </div>
    </div>
  );
}
