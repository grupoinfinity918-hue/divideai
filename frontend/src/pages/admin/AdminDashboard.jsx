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
import { authHeader } from '../../context/AuthContext';

const TABS = [
  { key: 'withdrawals', label: 'Alertas de Saque' },
  { key: 'chats', label: 'Monitoria de Chats' },
  { key: 'approval', label: 'Aprovação de Anúncios' },
  { key: 'categories', label: 'Gerenciar Categorias' },
  { key: 'users', label: 'Gestão de Usuários' },
  { key: 'listings', label: 'Gestão de Anúncios' },
  { key: 'reports', label: 'Denúncias' },
  { key: 'settings', label: 'Configurações' }
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('withdrawals');
  const [settings, setSettings] = useState({ aiChatEnabled: true, activeTheme: 'DEFAULT' });

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

        {tab === 'withdrawals' && <WithdrawalAlerts />}
        {tab === 'chats' && <ChatMonitoring />}
        {tab === 'approval' && <ListingApproval />}
        {tab === 'categories' && <CategoryManager />}
        {tab === 'users' && <UserManagement />}
        {tab === 'listings' && <ListingManagement />}
        {tab === 'reports' && <ReportsInbox />}
        {tab === 'settings' && (
          <div className="flex flex-col gap-6 max-w-md">
            <div className="card p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Assistente de IA Institucional</p>
                <p className="text-xs text-gray-500 mt-1">Chat flutuante de dúvidas na Home</p>
              </div>
              <button
                onClick={toggleAI}
                className={settings.aiChatEnabled ? 'btn-primary text-sm' : 'btn-outline text-sm'}
              >
                {settings.aiChatEnabled ? 'Ligado' : 'Desligado'}
              </button>
            </div>

            <ThemeSelector
              activeTheme={settings.activeTheme}
              onChange={key => setSettings(prev => ({ ...prev, activeTheme: key }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}
