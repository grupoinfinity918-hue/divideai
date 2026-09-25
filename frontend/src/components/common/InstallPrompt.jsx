import { useEffect, useState } from 'react';
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null); const [open, setOpen] = useState(false); const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone || localStorage.getItem('da_install_dismissed') === '1') return;
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isiOS);
    const fn = e => { e.preventDefault(); setDeferred(e); setOpen(true); };
    window.addEventListener('beforeinstallprompt', fn);
    if (isiOS) setOpen(true);
    return () => window.removeEventListener('beforeinstallprompt', fn);
  }, []);
  if (!open) return null;
  async function install() {
    if (deferred) { deferred.prompt(); await deferred.userChoice; setDeferred(null); setOpen(false); }
  }
  return <div className="fixed bottom-4 right-4 z-[80] max-w-[300px] rounded-2xl bg-white border shadow-xl p-4 da-install">
    <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-pink-soft flex items-center justify-center text-pink-neon font-black">D</div><div className="flex-1"><p className="font-bold text-gray-900">Instale nosso app</p><p className="text-xs text-gray-500 mt-1">Tenha o Divide Aí na sua tela inicial.</p></div><button onClick={()=>{setOpen(false);localStorage.setItem('da_install_dismissed','1')}} className="text-gray-400">×</button></div>
    {ios ? <div className="text-xs text-gray-600 mt-3 leading-5">No Safari: toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.</div> : <button onClick={install} className="btn-primary w-full mt-3">Instalar Divide Aí</button>}
  </div>;
}
