import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function ProductForm() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    price: '',
    slotsTotal: '',
    description: '',
    rules: '',
    autoDelivery: false,
    autoDeliveryPayload: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch('/api/seller/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setStatus('done');
      setForm({ categoryId: '', title: '', price: '', slotsTotal: '', description: '', rules: '', autoDelivery: false, autoDeliveryPayload: '' });
    } else {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl flex flex-col gap-4">
      <h3 className="font-bold text-lg text-gray-900">Anunciar Novo Produto</h3>

      <div>
        <label className="text-sm font-medium text-gray-700">Categoria</label>
        <select
          value={form.categoryId}
          onChange={e => setForm({ ...form, categoryId: e.target.value })}
          required
          className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
        >
          <option value="">Selecione...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Título</label>
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
          className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Quantidade de Vagas</label>
          <input
            type="number"
            min="1"
            value={form.slotsTotal}
            onChange={e => setForm({ ...form, slotsTotal: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={4}
          required
          className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Regras (opcional)</label>
        <textarea
          value={form.rules}
          onChange={e => setForm({ ...form, rules: e.target.value })}
          rows={3}
          placeholder="Ex: não compartilhar a tela, avisar antes de trocar de dispositivo..."
          className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.autoDelivery}
          onChange={e => setForm({ ...form, autoDelivery: e.target.checked })}
        />
        Entrega Automática (o sistema entrega os dados sozinho)
      </label>

      {form.autoDelivery && (
        <div>
          <label className="text-sm font-medium text-gray-700">Credenciais para entrega automática</label>
          <textarea
            value={form.autoDeliveryPayload}
            onChange={e => setForm({ ...form, autoDeliveryPayload: e.target.value })}
            rows={3}
            placeholder="E-mail:senha ou dados de acesso"
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>
      )}

      {!form.autoDelivery && (
        <p className="text-xs text-gray-500">
          Entrega Manual: você enviará os dados de acesso pelo chat da venda após a confirmação do pagamento.
        </p>
      )}

      <button className="btn-primary" disabled={status === 'saving'}>
        {status === 'saving' ? 'Publicando...' : 'Publicar Anúncio'}
      </button>

      {status === 'done' && <p className="text-sm text-green-600">Anúncio publicado com sucesso!</p>}
      {status === 'error' && <p className="text-sm text-pink-dark">Erro ao publicar. Tente novamente.</p>}
    </form>
  );
}
