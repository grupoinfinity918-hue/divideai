import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';
import ImageUploadField from '../common/ImageUploadField';

const COLORS = ['#ec1c6a', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function StoreSettings() {
  const [form, setForm] = useState({ storeName: '', storeColor: '#ec1c6a', storeBannerUrl: '', avatarUrl: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { headers: authHeader() })
      .then(r => r.json())
      .then(u => setForm({
        storeName: u.storeName || '',
        storeColor: u.storeColor || '#ec1c6a',
        storeBannerUrl: u.storeBannerUrl || '',
        avatarUrl: u.avatarUrl || ''
      }))
      .catch(() => {});
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setStatus('saving');
    await fetch('/api/seller/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    setStatus('done');
  }

  return (
    <form onSubmit={handleSave} className="card p-6 max-w-md flex flex-col gap-5">
      <h3 className="font-bold text-lg text-gray-900">Minha Loja</h3>

      <div>
        <label className="text-sm font-medium text-gray-700">Nome da loja</label>
        <input
          value={form.storeName}
          onChange={e => setForm({ ...form, storeName: e.target.value })}
          placeholder="Ex: Loja do João"
          className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Cor de destaque</label>
        <div className="flex gap-2 mt-1">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, storeColor: c })}
              className={`w-8 h-8 rounded-full border-2 ${form.storeColor === c ? 'border-gray-900' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <ImageUploadField
        label="Foto de perfil"
        value={form.avatarUrl}
        onChange={v => setForm({ ...form, avatarUrl: v })}
      />

      <ImageUploadField
        label="Banner da loja"
        value={form.storeBannerUrl}
        onChange={v => setForm({ ...form, storeBannerUrl: v })}
      />

      <button className="btn-primary" disabled={status === 'saving'}>
        {status === 'saving' ? 'Salvando...' : 'Salvar Loja'}
      </button>
      {status === 'done' && <p className="text-sm text-green-600">Loja atualizada!</p>}
    </form>
  );
}
