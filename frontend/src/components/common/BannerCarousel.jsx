import { useEffect, useState } from 'react';
export default function BannerCarousel({ theme='DEFAULT' }) {
  const [banners,setBanners]=useState([]); const [i,setI]=useState(0);
  useEffect(()=>{fetch(`/api/banners?theme=${encodeURIComponent(theme)}`).then(r=>r.ok?r.json():[]).then(setBanners).catch(()=>{});},[theme]);
  useEffect(()=>{if(banners.length<2)return; const t=setInterval(()=>setI(x=>(x+1)%banners.length),5000); return()=>clearInterval(t)},[banners.length]);
  if(!banners.length) return <section className="hero-gradient rounded-3xl overflow-hidden mt-5 p-7 md:p-12"><p className="text-white/80 text-sm font-semibold">DIVIDE AÍ</p><h1 className="text-3xl md:text-5xl font-black text-white max-w-2xl mt-2">Streaming, assinaturas e serviços digitais em um só lugar.</h1><p className="text-white/80 mt-4 max-w-xl">Encontre ofertas, compre com Pix e acompanhe seus pedidos.</p></section>;
  const b=banners[i];
  return <section className="mt-5 relative overflow-hidden rounded-3xl bg-gray-100 aspect-[16/6] min-h-[170px] max-h-[430px]">
    <a href={b.href || '#'} onClick={e=>!b.href&&e.preventDefault()} className="block h-full"><picture className="block h-full"><source media="(max-width: 640px)" srcSet={b.mobileUrl||b.desktopUrl}/><img src={b.desktopUrl} alt={b.title||'Banner Divide Aí'} className="w-full h-full object-cover" /></picture></a>
    {banners.length>1 && <><button onClick={()=>setI((i-1+banners.length)%banners.length)} className="carousel-arrow left-3">‹</button><button onClick={()=>setI((i+1)%banners.length)} className="carousel-arrow right-3">›</button><div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">{banners.map((_,n)=><button key={n} onClick={()=>setI(n)} className={`w-2 h-2 rounded-full ${n===i?'bg-white':'bg-white/50'}`} />)}</div></>}
  </section>;
}
