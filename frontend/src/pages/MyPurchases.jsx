import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader } from '../context/AuthContext';

const STATUS_LABEL = {
  AWAITING_PAYMENT: 'Aguardando Pagamento',
  PAID: 'Pago',
  AWAITING_DELIVERY: 'Aguardando Entrega',
  DELIVERED: 'Entregue',
  IN_WARRANTY: 'Em Garantia',
  COMPLETED: 'Concluído',
  DISPUTED: 'Em Disputa',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado'
};

export default function MyPurchases() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/orders/mine', { headers: authHeader() })
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Compras</h1>

        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <div key={order.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.listing?.title}</p>
                <p className="text-xs text-gray-500">Protocolo: {order.protocol}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-pink-neon">R$ {Number(order.amount).toFixed(2)}</span>
                <span className="text-xs font-bold bg-pink-soft text-pink-neon px-3 py-1 rounded-full whitespace-nowrap">
                  {STATUS_LABEL[order.status] || order.status}
                </span>
                {order.status === 'AWAITING_PAYMENT' && (
                  <Link to={`/checkout/${order.id}`} className="btn-outline text-xs whitespace-nowrap">
                    Pagar
                  </Link>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-gray-400">Você ainda não fez nenhuma compra.</p>
          )}
        </div>
      </main>
    </div>
  );
}
