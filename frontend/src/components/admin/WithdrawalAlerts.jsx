import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function WithdrawalAlerts() {
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/admin/withdrawals', { headers: authHeader() });
    if (res.ok) setWithdrawals(await res.json());
  }

  async function markPaid(id) {
    setWithdrawals(prev => prev.filter(w => w.id !== id));
    await fetch(`/api/admin/withdrawals/${id}/pay`, { method: 'POST', headers: authHeader() });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Alertas de Saque</h2>
      <div className="flex flex-col gap-3 max-w-2xl">
        {withdrawals.map(w => (
          <div key={w.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{w.seller?.name}</p>
              <p className="text-xs text-gray-500">{w.pixKeyType}: {w.pixKey}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-extrabold text-pink-neon">R$ {Number(w.amount).toFixed(2)}</span>
              <button onClick={() => markPaid(w.id)} className="btn-primary text-sm">Marcar como Pago</button>
            </div>
          </div>
        ))}
        {withdrawals.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma solicitação de saque pendente.</p>
        )}
      </div>
    </div>
  );
}
