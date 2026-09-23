import { useEffect, useState } from 'react';
import { listAvailableThemes, registerTheme, applyTheme } from '../../services/themeRegistry';
import { authHeader } from '../../context/AuthContext';

export default function ThemeSelector({ activeTheme, onChange }) {
  const [themes, setThemes] = useState(listAvailableThemes());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemoteThemes();
  }, []);

  async function loadRemoteThemes() {
    try {
      const res = await fetch('/api/admin/themes', { headers: authHeader() });
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
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ activeTheme: key })
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-gray-900 mb-3">Tema Sazonal Ativo</h3>
      {loading && <p className="text-sm text-gray-400">Carregando temas...</p>}
      <div className="flex gap-3 flex-wrap">
        {themes.map(theme => (
          <button
            key={theme.key}
            onClick={() => handleSelect(theme.key)}
            className={theme.key === activeTheme ? 'btn-primary text-sm' : 'btn-outline text-sm'}
          >
            {theme.label}
          </button>
        ))}
      </div>
      {themes.length === 1 && (
        <p className="text-xs text-gray-400 mt-3">
          Nenhum tema sazonal cadastrado além do padrão. Novos temas registrados via
          registerTheme() ou /api/admin/themes aparecem aqui automaticamente.
        </p>
      )}
    </div>
  );
}
