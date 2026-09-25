import { useState } from 'react';
import Header from '../../components/common/Header';
import KanbanBoard from '../../components/crm/KanbanBoard';
import ProductForm from '../../components/seller/ProductForm';
import WalletPanel from '../../components/seller/WalletPanel';
import PreSaleInbox from '../../components/seller/PreSaleInbox';
import MyProducts from '../../components/seller/MyProducts';
import StoreCustomize from '../../components/seller/StoreCustomize';
import KycGate from '../../components/seller/KycGate';
import OrderManagement from '../../components/seller/OrderManagement';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'orders', label: 'Pedidos' },
  { key: 'chats', label: 'Atendimentos' },
  { key: 'presale', label: 'Dúvidas de Produtos' },
  { key: 'products', label: 'Meus Produtos' },
  { key: 'new', label: 'Anunciar Novo Produto' },
  { key: 'store', label: 'Minha Loja' },
  { key: 'wallet', label: 'Carteira' }
];

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('chats');
  const [kycDone, setKycDone] = useState(user?.role === 'SELLER');

  const needsKyc = user?.role === 'CLIENT' && !kycDone;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel da Loja</h1>

        {needsKyc ? (
          <KycGate onApproved={() => setKycDone(true)} />
        ) : (
          <>
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

            {tab === 'orders' && <OrderManagement />}
            {tab === 'chats' && <KanbanBoard />}
            {tab === 'presale' && <PreSaleInbox />}
            {tab === 'products' && <MyProducts />}
            {tab === 'new' && <ProductForm />}
            {tab === 'store' && <StoreCustomize />}
            {tab === 'wallet' && <WalletPanel />}
          </>
        )}
      </main>
    </div>
  );
}
