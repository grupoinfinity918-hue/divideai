import { useEffect, useState } from 'react';
import { listAvailableThemes, registerTheme, applyTheme } from '../../services/themeRegistry';

export default function ThemeSelector({ activeTheme, onChange }) {
  const [themes, setThemes] = useState(listAvailableThemes());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemoteThemes();
  }, []);

  async function loadRemoteThemes() {
    try {
      const res = await fetch('/api/admin/themes');
      if (res.ok) {
        const remoteThemes = await res.json();
        remoteThemes.forEach(registerTheme);
      }
    } catch {
      // sem temas remotos disponíveis, segue apenas com os locais
    } finally {
      setThemes(listAvailableThemes());
      setLoading(false);
    }
  }

  async function handleSelect(key) {
    applyTheme(key);
    onChange(key);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeTheme: key })
    });
  }

  return (
    <div className="da-card">
      <h3>Tema Sazonal Ativo</h3>
      {loading && <p>Carregando temas...</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {themes.map(theme => (
          <button
            key={theme.key}
            className={theme.key === activeTheme ? 'da-btn' : 'da-btn da-btn-outline'}
            onClick={() => handleSelect(theme.key)}
          >
            {theme.label}
          </button>
        ))}
      </div>
      {themes.length === 1 && (
        <p style={{ color: 'var(--da-text-muted)', fontSize: 13, marginTop: 8 }}>
          Nenhum tema sazonal cadastrado além do padrão. Novos temas registrados via
          registerTheme() ou /api/admin/themes aparecem aqui automaticamente.
        </p>
      )}
    </div>
  );
}
