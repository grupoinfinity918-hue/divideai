import { useEffect, useState } from 'react';

export default function BannerCarousel({ theme='DEFAULT', intervalMs=5000 }) {
  const [banners, setBanners] = useState([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    fetch(`/api/banners?theme=${encodeURIComponent(theme)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBanners(data); setI(0); })
      .catch(() => setBanners([]));
  }, [theme]);

  useEffect(() => {
    if (banners.length < 2) return;
    const delay = Math.max(2000, Number(intervalMs) || 5000);
    const t = setInterval(() => setI(x => (x + 1) % banners.length), delay);
    return () => clearInterval(t);
  }, [banners.length, intervalMs]);

  if (!banners.length) return <section className="hero-gradient rounded-3xl overflow-hidden mt-5 p-7 md:p-12"><p className="text-white/80 text-sm font-semibold">DIVIDE AÍ</p><h1 className="text-3xl md:text-5xl font-black text-white max-w-2xl mt-2">Streaming, assinaturas e serviços digitais em um só lugar.</h1><p className="text-white/80 mt-4 max-w-xl">Encontre ofertas, compre com Pix e acompanhe seus pedidos.</p></section>;

  const b = banners[i];
  const content = (
    <div className="relative h-full w-full">
      <picture className="absolute inset-0 block h-full"><source media="(max-width: 640px)" srcSet={b.mobileUrl || b.desktopUrl} /><img src={b.desktopUrl} alt={b.title || 'Banner'} className="w-full h-full object-cover" /></picture>
      {(b.eyebrow || b.title || b.description || b.buttonText) && (
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/65 via-black/20 to-transparent">
          <div className="p-6 md:p-10 max-w-2xl text-white">
            {b.eyebrow && <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-white/80">{b.eyebrow}</p>}
            {b.title && <h2 className="text-2xl md:text-5xl font-black leading-tight mt-1">{b.title}</h2>}
            {b.description && <p className="mt-3 text-sm md:text-base text-white/85 max-w-xl">{b.description}</p>}
            {b.buttonText && <span className="inline-block mt-5 rounded-xl bg-white text-gray-900 px-5 py-2.5 text-xs md:text-sm font-bold">{b.buttonText}</span>}
          </div>
        </div>
      )}
    </div>
  );

  return <section className="mt-5 relative overflow-hidden rounded-3xl bg-gray-100 aspect-[16/6] min-h-[170px] max-h-[430px]">
    {b.href ? <a href={b.href} className="block h-full">{content}</a> : content}
    {banners.length > 1 && <>
      <button onClick={() => setI((i - 1 + banners.length) % banners.length)} className="carousel-arrow left-3">‹</button>
      <button onClick={() => setI((i + 1) % banners.length)} className="carousel-arrow right-3">›</button>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">{banners.map((_, n) => <button aria-label={`Ir para banner ${n + 1}`} key={n} onClick={() => setI(n)} className={`w-2 h-2 rounded-full ${n === i ? 'bg-white' : 'bg-white/50'}`} />)}</div>
    </>}
  </section>;
}
