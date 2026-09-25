import { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import ThemeSelector from '../../components/admin/ThemeSelector';
import WithdrawalAlerts from '../../components/admin/WithdrawalAlerts';
import CategoryManager from '../../components/admin/CategoryManager';
import UserManagement from '../../components/admin/UserManagement';
import ListingManagement from '../../components/admin/ListingManagement';
import ReportsInbox from '../../components/admin/ReportsInbox';
import ChatMonitoring from './ChatMonitoring';
import ListingApproval from './ListingApproval';
import AdminOverview from '../../components/admin/AdminOverview';
import CommentModeration from '../../components/admin/CommentModeration';
import BannerManager from '../../components/admin/BannerManager';
import CouponManager from '../../components/admin/CouponManager';
import OwnProductManager from '../../components/admin/OwnProductManager';
import { authHeader } from '../../context/AuthContext';

const TABS = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'own-products', label: 'Meus Produtos' },
  { key: 'withdrawals', label: 'Alertas de Saque' },
  { key: 'chats', label: 'Monitoria de Chats' },
  { key: 'approval', label: 'Aprovação de Anúncios' },
  { key: 'categories', label: 'Gerenciar Categorias' },
  { key: 'users', label: 'Gestão de Usuários' },
  { key: 'listings', label: 'Gestão de Anúncios' },
  { key: 'reports', label: 'Denúncias' },
  { key: 'comments', label: 'Comentários' },
  { key: 'banners', label: 'Banners' },
  { key: 'coupons', label: 'Cupons' },
  { key: 'settings', label: 'Configurações' }
];

function PlatformSettings({ settings, setSettings, toggleAI }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveSettings() {
    setSaving(true); setSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ carouselIntervalMs: Number(settings.carouselIntervalMs), platformRules: settings.platformRules })
    });
    if (res.ok) { setSettings(await res.json()); setSaved(true); }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="card p-5 flex items-center justify-between">
        <div><p className="font-bold text-gray-900">Assistente de IA Institucional</p><p className="text-xs text-gray-500 mt-1">Chat flutuante de dúvidas na Home</p></div>
        <button onClick={toggleAI} className={settings.aiChatEnabled ? 'btn-primary text-sm' : 'btn-outline text-sm'}>{settings.aiChatEnabled ? 'Ligado' : 'Desligado'}</button>
      </div>

      <ThemeSelector activeTheme={settings.activeTheme} onChange={key => setSettings(prev => ({ ...prev, activeTheme: key }))} />

      <div className="card p-5 space-y-5">
        <div><h3 className="font-bold text-gray-900">Carrossel da Home</h3><p className="text-xs text-gray-500 mt-1">Defina quanto tempo cada banner permanece na tela.</p></div>
        <label className="text-sm font-medium block">Tempo de troca<select value={settings.carouselIntervalMs} onChange={e => setSettings(prev => ({ ...prev, carouselIntervalMs: Number(e.target.value) }))} className="field mt-1"><option value={3000}>3 segundos</option><option value={5000}>5 segundos</option><option value={7000}>7 segundos</option><option value={10000}>10 segundos</option><option value={15000}>15 segundos</option><option value={20000}>20 segundos</option><option value={30000}>30 segundos</option></select></label>
        <div><label className="text-sm font-medium block">Regras gerais da plataforma</label><textarea value={settings.platformRules || ''} onChange={e => setSettings(prev => ({ ...prev, platformRules: e.target.value }))} rows={8} maxLength={10000} className="field mt-1" placeholder="Escreva aqui as regras que você quiser alterar quando necessário..."/><p className="text-xs text-gray-400 mt-1">Essas regras ficam disponíveis nos detalhes dos produtos.</p></div>
        <button onClick={saveSettings} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar configurações'}</button>
        {saved && <p className="text-sm text-green-600">Configurações salvas.</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState({ aiChatEnabled: true, activeTheme: 'DEFAULT', carouselIntervalMs: 5000, platformRules: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const res = await fetch('/api/settings');
    if (res.ok) setSettings(await res.json());
  }

  async function toggleAI() {
    const next = !settings.aiChatEnabled;
    setSettings(prev => ({ ...prev, aiChatEnabled: next }));
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ aiChatEnabled: next })
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel do Administrador</h1>

        <div className="flex gap-2 border-b border-pink-100 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-pink-neon text-pink-neon'
                  : 'border-transparent text-gray-500 hover:text-pink-neon'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <AdminOverview />}
        {tab === 'own-products' && <OwnProductManager />}
        {tab === 'withdrawals' && <WithdrawalAlerts />}
        {tab === 'chats' && <ChatMonitoring />}
        {tab === 'approval' && <ListingApproval />}
        {tab === 'categories' && <CategoryManager />}
        {tab === 'users' && <UserManagement />}
        {tab === 'listings' && <ListingManagement />}
        {tab === 'reports' && <ReportsInbox />}
        {tab === 'comments' && <CommentModeration />}
        {tab === 'banners' && <BannerManager />}
        {tab === 'coupons' && <CouponManager />}
        {tab === 'settings' && (
          <PlatformSettings settings={settings} setSettings={setSettings} toggleAI={toggleAI} />
        )}
      </main>
    </div>
  );
}
