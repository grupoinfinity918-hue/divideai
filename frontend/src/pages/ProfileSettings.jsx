import { useState } from 'react';
import Header from '../components/common/Header';
import ImageUploadField from '../components/common/ImageUploadField';
import { authHeader, useAuth } from '../context/AuthContext';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [status, setStatus] = useState('');

  async function handleSave() {
    setStatus('saving');
    await fetch('/api/profile/avatar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ avatarUrl })
    });
    setStatus('done');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-10 pb-16">
        <div className="card p-6 flex flex-col gap-5">
          <h1 className="font-bold text-lg text-gray-900">Meu Perfil</h1>
          <ImageUploadField label="Foto de perfil" value={avatarUrl} onChange={setAvatarUrl} />
          <button onClick={handleSave} className="btn-primary" disabled={status === 'saving'}>
            {status === 'saving' ? 'Salvando...' : 'Salvar'}
          </button>
          {status === 'done' && <p className="text-sm text-green-600">Foto atualizada!</p>}
        </div>
      </main>
    </div>
  );
}
