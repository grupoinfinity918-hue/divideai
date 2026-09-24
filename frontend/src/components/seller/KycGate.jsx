import { useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function KycGate({ onApproved }) {
  const [form, setForm] = useState({ fullName: '', cpf: '', birthDate: '', address: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/seller/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) onApproved();
    else setError(data.error || 'Erro ao enviar dados');
  }

  return (
    <div className="max-w-md mx-auto card p-6">
      <h2 className="font-bold text-lg text-gray-900 mb-1">Libere seu acesso de Vendedor</h2>
      <p className="text-sm text-gray-500 mb-5">
        Por segurança, exigimos alguns dados antes de liberar a venda no Divide Aí.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Nome completo</label>
          <input
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">CPF</label>
          <input
            value={form.cpf}
            onChange={e => setForm({ ...form, cpf: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Data de nascimento</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={e => setForm({ ...form, birthDate: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Endereço completo</label>
          <input
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-pink-dark">{error}</p>}

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Enviando...' : 'Liberar acesso de Vendedor'}
        </button>
      </form>
    </div>
  );
}
