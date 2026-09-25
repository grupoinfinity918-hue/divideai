import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import ProductCard from '../components/common/ProductCard';
import FloatingAIChat from '../components/common/FloatingAIChat';
import BannerCarousel from '../components/common/BannerCarousel';
import InstallPrompt from '../components/common/InstallPrompt';
import { applyTheme } from '../services/themeRegistry';

function Rail({ title, data, href }) {
  return <section className="py-7"><div className="flex items-center justify-between mb-4"><div><p className="text-xs font-bold uppercase tracking-wider text-pink-neon">Divide Aí</p><h2 className="text-xl md:text-2xl font-black text-gray-900">{title}</h2></div><Link to={href} className="btn-outline text-xs">Ver todos</Link></div><div className="product-rail">{data.map(item=><ProductCard key={item.id} item={item}/>)}{!data.length&&<p className="text-sm text-gray-400">Nenhuma oferta disponível no momento.</p>}</div></section>;
}
export default function Home(){
 const [settings,setSettings]=useState({aiChatEnabled:true,homepageOrder:['OWN','THIRD_PARTY'],activeTheme:'DEFAULT',carouselIntervalMs:5000,platformRules:''}); const[own,setOwn]=useState([]),[third,setThird]=useState([]),[cats,setCats]=useState([]),[cat,setCat]=useState(null);
 useEffect(()=>{Promise.all([fetch('/api/settings').then(r=>r.json()),fetch('/api/categories').then(r=>r.json())]).then(([s,c])=>{setSettings(s);applyTheme(s.activeTheme);setCats(c)})},[]);
 useEffect(()=>{for(const [origin,setter] of [['OWN',setOwn],['THIRD_PARTY',setThird]]){const p=new URLSearchParams({origin,featured:'true',limit:'8'});if(cat)p.set('category',cat);fetch('/api/listings?'+p).then(r=>r.json()).then(setter).catch(()=>{})}},[cat]);
 const sections=useMemo(()=>({OWN:{title:'Assine com o Divide Aí',data:own,href:'/vitrine/proprias'},THIRD_PARTY:{title:'Ofertas da comunidade',data:third,href:'/vitrine/marketplace'}}),[own,third]);
 return <div className="min-h-screen bg-white"><Header/><main className="max-w-7xl mx-auto px-4 pb-20"><div className="market-search"><span>⌕</span><input placeholder="Busque streaming, serviços, ofertas..."/><kbd>⌘ K</kbd></div><div className="category-strip"><button onClick={()=>setCat(null)} className={!cat?'cat-active':'cat'}>Tudo</button>{cats.map(c=><button key={c.id} onClick={()=>setCat(c.slug)} className={cat===c.slug?'cat-active':'cat'}>{c.name}</button>)}<Link to="/ranking" className="cat">🏆 Ranking</Link></div><BannerCarousel theme={settings.activeTheme} intervalMs={settings.carouselIntervalMs}/>{settings.homepageOrder.map(k=><Rail key={k} {...sections[k]} />)}<section className="grid md:grid-cols-3 gap-4 py-8"><div className="feature-card"><b>Pagamento Pix</b><span>Checkout rápido e confirmação automática.</span></div><div className="feature-card"><b>Compra acompanhada</b><span>Tenha protocolo e histórico do seu pedido.</span></div><div className="feature-card"><b>Vendedores avaliados</b><span>Escolha serviços com reputação e avaliações.</span></div></section></main><FloatingAIChat enabled={settings.aiChatEnabled}/><InstallPrompt/></div>;
}
