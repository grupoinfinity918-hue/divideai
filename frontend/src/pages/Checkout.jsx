import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { authHeader } from '../context/AuthContext';

export default function Checkout() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [pix, setPix] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrderAndCharge();
  }, [orderId]);

  async function loadOrderAndCharge() {
    const orderRes = await fetch(`/api/orders/${orderId}`, { headers: authHeader() });
    if (!orderRes.ok) {
      setError('Pedido não encontrado.');
      return;
    }
    const orderData = await orderRes.json();
    setOrder(orderData);

    const chargeRes = await fetch('/api/pix/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ orderId })
    });

    if (chargeRes.ok) {
      setPix(await chargeRes.json());
    } else {
      setError('Não foi possível gerar o Pix agora. Tente novamente em instantes ou fale com o suporte.');
    }
  }

  function copyCode() {
    if (!pix?.pixCopiaCola) return;
    navigator.clipboard.writeText(pix.pixCopiaCola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-10 pb-16">
        <div className="card p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Pagamento via Pix</h1>
          {order && (
            <>
              <p className="text-sm text-gray-500 mb-1">{order.listing?.title}</p>
              <p className="text-3xl font-extrabold text-pink-neon mb-6">
                R$ {Number(order.amount).toFixed(2)}
              </p>
            </>
          )}

          {error && (
            <p className="text-sm text-pink-dark bg-pink-soft border border-pink-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {!error && !pix && (
            <p className="text-sm text-gray-400">Gerando código Pix...</p>
          )}

          {pix && (
            <div className="flex flex-col gap-4">
              <div className="bg-pink-soft border border-pink-100 rounded-xl p-4 text-xs text-gray-600 break-all">
                {pix.pixCopiaCola || 'Código Pix indisponível — tente novamente.'}
              </div>
              <button onClick={copyCode} className="btn-primary">
                {copied ? 'Código copiado!' : 'Copiar código Pix'}
              </button>
              <p className="text-xs text-gray-400">
                Protocolo do pedido: <strong>{order?.protocol}</strong><br />
                Assim que o pagamento for confirmado, você verá seu pedido em Minhas Compras
                e o chat da venda será liberado automaticamente.
              </p>
              <button onClick={() => navigate('/minhas-compras')} className="btn-outline text-sm">
                Ir para Minhas Compras
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
