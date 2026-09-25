import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

const EMPTY = { eyebrow: 'DIVIDE AÍ', title: '', description: '', buttonText: '', desktopUrl: '', mobileUrl: '', href: '', theme: 'DEFAULT', sortOrder: 0, active: true };

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  async function load() {
    const r = await fetch('/api/admin/banners', { headers: authHeader() });
    if (r.ok) setBanners(await r.json());
  }
  useEffect(() => { load(); }, []);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }
  function reset() { setForm(EMPTY); setEditingId(null); setStatus(''); }
  function edit(x) {
    setEditingId(x.id);
    setForm({ eyebrow: x.eyebrow || '', title: x.title || '', description: x.description || '', buttonText: x.buttonText || '', desktopUrl: x.desktopUrl || '', mobileUrl: x.mobileUrl || '', href: x.href || '', theme: x.theme || 'DEFAULT', sortOrder: x.sortOrder || 0, active: x.active !== false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(e) {
    e.preventDefault(); setStatus('saving');
    const res = await fetch(editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    if (res.ok) { await load(); reset(); setStatus('saved'); } else { const d = await res.json().catch(() => ({})); setStatus(d.error || 'Não foi possível salvar.'); }
  }

  async function remove(id) {
    if (!confirm('Excluir este banner?')) return;
    const r = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE', headers: authHeader() });
    if (r.ok) load();
  }

  async function toggle(id, active) {
    const r = await fetch(`/api/admin/banners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ active: !active }) });
    if (r.ok) load();
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold">Banners e carrossel</h2><p className="text-sm text-gray-500 mt-1">Cada banner possui seus próprios textos. Você pode criar, editar, excluir, ordenar e ativar/desativar.</p></div>

      <form onSubmit={save} className="card p-5 grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2 flex items-center justify-between"><h3 className="font-bold">{editingId ? 'Editar banner' : 'Adicionar banner'}</h3>{editingId && <button type="button" onClick={reset} className="text-sm text-gray-500 underline">Cancelar</button>}</div>
        <input placeholder="Texto pequeno / etiqueta" value={form.eyebrow} onChange={e => update('eyebrow', e.target.value)} className="field" />
        <input placeholder="Título do banner" value={form.title} onChange={e => update('title', e.target.value)} className="field" />
        <textarea placeholder="Descrição do banner" value={form.description} onChange={e => update('description', e.target.value)} rows={3} className="field md:col-span-2" />
        <input placeholder="Texto do botão (opcional)" value={form.buttonText} onChange={e => update('buttonText', e.target.value)} className="field" />
        <input placeholder="Link ao clicar (opcional)" value={form.href} onChange={e => update('href', e.target.value)} className="field" />
        <input required placeholder="URL ou caminho da imagem desktop" value={form.desktopUrl} onChange={e => update('desktopUrl', e.target.value)} className="field" />
        <input placeholder="URL ou caminho da imagem mobile (opcional)" value={form.mobileUrl} onChange={e => update('mobileUrl', e.target.value)} className="field" />
        <select value={form.theme} onChange={e => update('theme', e.target.value)} className="field"><option value="DEFAULT">Padrão</option><option value="CHRISTMAS">Natal</option><option value="NEW_YEAR">Ano Novo</option><option value="CARNIVAL">Carnaval</option><option value="SAO_JOAO">São João</option></select>
        <input type="number" min="0" placeholder="Ordem" value={form.sortOrder} onChange={e => update('sortOrder', Number(e.target.value))} className="field" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} /> Banner ativo no carrossel</label>
        <button className="btn-primary md:col-span-2" disabled={status === 'saving'}>{status === 'saving' ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar banner'}</button>
        {status === 'saved' && <p className="text-sm text-green-600 md:col-span-2">Banner salvo.</p>}
        {status && !['saving','saved'].includes(status) && <p className="text-sm text-red-600 md:col-span-2">{status}</p>}
      </form>

      <div className="space-y-4">
        <h3 className="font-bold">Banners publicados</h3>
        {banners.map(x => (
          <div className={`card overflow-hidden ${!x.active ? 'opacity-60' : ''}`} key={x.id}>
            <div className="relative aspect-[16/6] bg-gray-100"><img src={x.desktopUrl} alt={x.title || 'Banner'} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} /><div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 bg-gradient-to-r from-black/60 via-black/20 to-transparent text-white"><p className="text-xs font-bold uppercase tracking-wider">{x.eyebrow}</p><h4 className="text-2xl md:text-4xl font-black max-w-xl">{x.title || 'Sem título'}</h4>{x.description && <p className="mt-2 max-w-lg text-sm md:text-base">{x.description}</p>}{x.buttonText && <span className="mt-4 inline-block w-fit rounded-full bg-white text-gray-900 px-4 py-2 text-xs font-bold">{x.buttonText}</span>}</div></div>
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="font-bold">{x.title || 'Sem título'}</p><p className="text-xs text-gray-500">#{x.sortOrder} · {x.theme} · {x.active ? 'Ativo' : 'Desativado'}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => toggle(x.id, x.active)} className="btn-outline text-xs">{x.active ? 'Desativar' : 'Ativar'}</button><button onClick={() => edit(x)} className="btn-outline text-xs">Editar</button><button onClick={() => remove(x.id)} className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold">Excluir</button></div></div>
          </div>
        ))}
        {!banners.length && <p className="text-sm text-gray-400">Nenhum banner cadastrado.</p>}
      </div>
    </div>
  );
}
