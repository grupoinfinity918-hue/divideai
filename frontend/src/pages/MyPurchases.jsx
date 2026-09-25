import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader } from '../context/AuthContext';

const L={AWAITING_PAYMENT:'Aguardando pagamento',PAID:'Pagamento confirmado',AWAITING_DELIVERY:'Em produção',DELIVERED:'Entregue',IN_WARRANTY:'Em garantia',COMPLETED:'Concluído',DISPUTED:'Em disputa',REFUNDED:'Reembolsado',CANCELLED:'Cancelado'};

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  async function copy(){ try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(()=>setCopied(false),1500); } catch {} }
  return <button onClick={copy} className="text-xs font-bold text-pink-neon bg-pink-soft px-3 py-2 rounded-lg">{copied ? '✓ Copiado' : label}</button>;
}

function ReviewBox({ order, value, setValue, onSend }) {
  const already = order.reviews?.length > 0 || value?.sent;
  if (already) return <div className="mt-5 rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700 font-semibold">✓ Você já avaliou este vendedor.</div>;
  if (order.status !== 'COMPLETED') return null;
  return <div className="mt-5 rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-5">
    <div className="flex items-center justify-between gap-3"><div><p className="font-black text-gray-900">Como foi sua experiência?</p><p className="text-xs text-gray-500 mt-1">Avalie o vendedor e ajude outros clientes.</p></div><span className="text-2xl">⭐</span></div>
    <div className="flex gap-1 mt-4">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${n} estrelas`} onClick={()=>setValue({...value,stars:n})} className={`text-4xl leading-none transition-transform hover:scale-110 ${n<=(value?.stars||0)?'text-yellow-400':'text-gray-200'}`}>★</button>)}</div>
    <textarea value={value?.comment||''} onChange={e=>setValue({...value,comment:e.target.value})} placeholder="Conte como foi sua experiência com o vendedor (opcional)..." rows={3} className="w-full border border-pink-100 rounded-xl px-3 py-3 text-sm mt-4 bg-white" />
    <button onClick={onSend} disabled={!value?.stars} className="btn-primary text-sm mt-3 disabled:opacity-40">Enviar avaliação</button>
  </div>;
}

export default function MyPurchases(){
  const[o,setO]=useState([]); const[review,setReview]=useState({});
  useEffect(()=>{load()},[]);
  async function load(){const r=await fetch('/api/orders/mine',{headers:authHeader()});if(r.ok)setO(await r.json())}
  async function send(id){const x=review[id]||{};if(!x.stars)return;const r=await fetch(`/api/orders/${id}/reviews`,{method:'POST',headers:{'Content-Type':'application/json',...authHeader()},body:JSON.stringify(x)});if(r.ok){setReview(v=>({...v,[id]:{sent:true}}));load()}}
  return <><Header/><main className="max-w-4xl mx-auto px-4 py-8"><h1 className="text-2xl font-black">Minhas Compras</h1><p className="text-sm text-gray-500 mt-1">Acompanhe seus pedidos e consulte seus dados de acesso sempre que precisar.</p><div className="space-y-5 mt-6">{o.map(x=><div className="card p-5 md:p-6" key={x.id}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><b>{x.listing?.title}</b><p className="text-xs text-gray-500">{x.protocol} · {new Date(x.createdAt).toLocaleDateString('pt-BR')}</p>{x.seller && <Link to={`/loja/${x.seller.id}`} className="inline-flex mt-2 text-xs font-bold text-pink-neon hover:underline">Ver loja de {x.seller.storeName || x.seller.name} →</Link>}</div><div className="text-right"><b className="text-pink-neon">R$ {Number(x.amount).toFixed(2)}</b><p className="text-xs font-bold text-gray-500">{L[x.status]||x.status}</p></div></div>
    {(x.deliveryLogin || x.deliveryPassword || x.deliveryCredentials) && !['AWAITING_PAYMENT','CANCELLED','REFUNDED'].includes(x.status) && <div className="mt-5 rounded-2xl border border-pink-100 bg-gray-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-gray-900">🔐 Dados de acesso</p><p className="text-xs text-gray-500 mt-1">Você pode consultar estes dados aqui sempre que precisar.</p></div></div><div className="grid sm:grid-cols-2 gap-3 mt-4">{x.deliveryLogin && <div className="bg-white rounded-xl border p-3"><p className="text-[11px] uppercase font-bold text-gray-400">Login / E-mail</p><p className="font-semibold text-gray-800 break-all mt-1">{x.deliveryLogin}</p><CopyButton value={x.deliveryLogin} label="Copiar login"/></div>}{x.deliveryPassword && <div className="bg-white rounded-xl border p-3"><p className="text-[11px] uppercase font-bold text-gray-400">Senha</p><p className="font-semibold text-gray-800 break-all mt-1">{x.deliveryPassword}</p><CopyButton value={x.deliveryPassword} label="Copiar senha"/></div>}</div>{!x.deliveryLogin && !x.deliveryPassword && x.deliveryCredentials && <div className="bg-white rounded-xl border p-3 mt-3"><p className="text-[11px] uppercase font-bold text-gray-400">Dados de acesso</p><p className="font-semibold text-gray-800 whitespace-pre-wrap break-all mt-1">{x.deliveryCredentials}</p><CopyButton value={x.deliveryCredentials} label="Copiar dados"/></div>}</div>}
    <div className="flex flex-wrap gap-2 mt-4">{x.status==='AWAITING_PAYMENT'&&<Link to={`/checkout/${x.id}`} className="btn-primary text-xs">Pagar</Link>}<Link to={`/pedido/${x.protocol}`} className="btn-outline text-xs">Acompanhar pedido</Link></div>
    <ReviewBox order={x} value={review[x.id]||{}} setValue={v=>setReview(r=>({...r,[x.id]:v}))} onSend={()=>send(x.id)}/>
  </div>)}{!o.length&&<p className="text-sm text-gray-400">Você ainda não fez nenhuma compra.</p>}</div></main></>
}
