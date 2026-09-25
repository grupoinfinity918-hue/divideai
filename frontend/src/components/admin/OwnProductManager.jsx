import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';
import { ICON_MAP } from '../common/ProductCard';

const EMPTY = {
  categoryId: '', title: '', price: '', slotsTotal: '', billingPeriod: 'mensal',
  description: '', rules: '', icon: 'tv', autoDelivery: false, autoDeliveryPayload: '', isPrioritario: false
};

export default function OwnProductManager() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      loadProducts()
    ]).then(([cats]) => setCategories(cats)).catch(() => {});
  }, []);

  async function loadProducts() {
    const res = await fetch('/api/admin/own-products', { headers: authHeader() });
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
      return data;
    }
    return [];
  }

  function update(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      categoryId: item.categoryId || '', title: item.title || '', price: item.price ?? '', slotsTotal: item.slotsTotal ?? '',
      billingPeriod: item.billingPeriod || 'mensal', description: item.description || '', rules: item.rules || '',
      icon: item.icon || 'tv', autoDelivery: !!item.autoDelivery, autoDeliveryPayload: item.autoDeliveryPayload || '',
      isPrioritario: !!item.isPrioritario
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() { setEditingId(null); setForm(EMPTY); setStatus(''); }

  async function save(e) {
    e.preventDefault();
    setStatus('saving');
    const url = editingId ? `/api/admin/own-products/${editingId}` : '/api/admin/own-products';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(data.error || 'error'); return; }
    await loadProducts();
    setStatus(editingId ? 'updated' : 'done');
    setForm(EMPTY);
    setEditingId(null);
  }

  async function remove(id) {
    if (!confirm('Excluir este produto próprio? Pedidos existentes podem depender deste anúncio.')) return;
    const res = await fetch(`/api/admin/own-products/${id}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) loadProducts();
    else { const data = await res.json().catch(() => ({})); setStatus(data.error || 'Não foi possível excluir.'); }
  }

  async function togglePriority(item) {
    const res = await fetch(`/api/admin/own-products/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ isPrioritario: !item.isPrioritario })
    });
    if (res.ok) loadProducts();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Meus Produtos — Divide Aí</h2>
        <p className="text-sm text-gray-500 mt-1">Produtos criados aqui aparecem em <b>Assine com o Divide Aí</b>. Produtos dos vendedores continuam em <b>Ofertas da comunidade</b>.</p>
      </div>

      <form onSubmit={save} className="card p-5 grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center justify-between">
          <h3 className="font-bold">{editingId ? 'Editar produto próprio' : 'Criar novo produto próprio'}</h3>
          {editingId && <button type="button" onClick={reset} className="text-sm text-gray-500 underline">Cancelar edição</button>}
        </div>

        <label className="text-sm font-medium">Categoria<select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} required className="field mt-1"><option value="">Selecione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm font-medium">Título<input value={form.title} onChange={e => update('title', e.target.value)} required className="field mt-1" placeholder="Ex.: Netflix Premium" /></label>
        <label className="text-sm font-medium">Preço (R$)<input type="number" min="0" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} required className="field mt-1" /></label>
        <label className="text-sm font-medium">Vagas (opcional)<input type="number" min="1" value={form.slotsTotal} onChange={e => update('slotsTotal', e.target.value)} className="field mt-1" placeholder="Deixe vazio para ilimitado" /></label>
        <label className="text-sm font-medium">Período<select value={form.billingPeriod} onChange={e => update('billingPeriod', e.target.value)} className="field mt-1"><option value="mensal">Mensal</option><option value="trimestral">Trimestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option><option value="único">Pagamento único</option></select></label>
        <div><span className="text-sm font-medium">Ícone</span><div className="flex gap-2 flex-wrap mt-1">{Object.entries(ICON_MAP).map(([key, emoji]) => <button key={key} type="button" onClick={() => update('icon', key)} className={`w-10 h-10 rounded-xl border-2 ${form.icon === key ? 'border-pink-neon bg-pink-soft' : 'border-pink-100'}`}>{emoji}</button>)}</div></div>
        <label className="text-sm font-medium md:col-span-2">Descrição<textarea value={form.description} onChange={e => update('description', e.target.value)} required rows={4} className="field mt-1" /></label>
        <label className="text-sm font-medium md:col-span-2">Regras deste produto<textarea value={form.rules} onChange={e => update('rules', e.target.value)} rows={4} className="field mt-1" placeholder="Regras específicas deste produto..." /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.autoDelivery} onChange={e => update('autoDelivery', e.target.checked)} /> Entrega automática</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPrioritario} onChange={e => update('isPrioritario', e.target.checked)} /> Destacar na vitrine</label>
        {form.autoDelivery && <label className="text-sm font-medium md:col-span-2">Dados da entrega automática<textarea value={form.autoDeliveryPayload} onChange={e => update('autoDeliveryPayload', e.target.value)} rows={3} className="field mt-1" /></label>}
        <button disabled={status === 'saving'} className="btn-primary md:col-span-2">{status === 'saving' ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Publicar produto no Divide Aí'}</button>
        {status && !['saving','done','updated'].includes(status) && <p className="text-sm text-red-600 md:col-span-2">{status}</p>}
        {status === 'done' && <p className="text-sm text-green-600 md:col-span-2">Produto publicado na seção “Assine com o Divide Aí”.</p>}
        {status === 'updated' && <p className="text-sm text-green-600 md:col-span-2">Produto atualizado.</p>}
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">Produtos publicados</h3>
        {products.map(item => (
          <div key={item.id} className="card p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="min-w-0"><p className="font-bold truncate">{item.title}</p><p className="text-xs text-gray-500">{item.category?.name} · R$ {Number(item.price).toFixed(2)} · {item.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}</p></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => togglePriority(item)} className="btn-outline text-xs">{item.isPrioritario ? 'Tirar destaque' : 'Destacar'}</button><button onClick={() => startEdit(item)} className="btn-outline text-xs">Editar</button><button onClick={() => remove(item.id)} className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold">Excluir</button></div>
          </div>
        ))}
        {!products.length && <p className="text-sm text-gray-400">Você ainda não publicou produtos próprios.</p>}
      </div>
    </div>
  );
}
