import { useEffect, useState } from 'react';
import { authHeader } from '../../context/AuthContext';

export default function WalletPanel() {
  const [wallet, setWallet] = useState({ balanceHeld: 0, balanceFree: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [form, setForm] = useState({ amount: '', pixKeyType: 'CPF', pixKey: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadWallet();
    loadWithdrawals();
  }, []);

  async function loadWallet() {
    const res = await fetch('/api/wallet', { headers: authHeader() });
    if (res.ok) setWallet(await res.json());
  }

  async function loadWithdrawals() {
    const res = await fetch('/api/wallet/withdrawals/mine', { headers: authHeader() });
    if (res.ok) setWithdrawals(await res.json());
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setStatus('done');
      setForm({ amount: '', pixKeyType: 'CPF', pixKey: '' });
      loadWallet();
      loadWithdrawals();
    } else {
      const data = await res.json();
      setStatus(data.error || 'Erro ao solicitar saque');
    }
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Saldo Bloqueado (retenção 15 dias)</p>
          <p className="text-2xl font-extrabold text-gray-400">R$ {Number(wallet.balanceHeld).toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Saldo Disponível para Saque</p>
          <p className="text-2xl font-extrabold text-pink-neon">R$ {Number(wallet.balanceFree).toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleWithdraw} className="card p-6 max-w-md flex flex-col gap-4">
        <h3 className="font-bold text-gray-900">Solicitar Saque</h3>

        <div>
          <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Tipo de Chave Pix</label>
          <select
            value={form.pixKeyType}
            onChange={e => setForm({ ...form, pixKeyType: e.target.value })}
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          >
            <option value="CPF">CPF</option>
            <option value="EMAIL">E-mail</option>
            <option value="PHONE">Telefone</option>
            <option value="RANDOM">Aleatória</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Chave Pix</label>
          <input
            value={form.pixKey}
            onChange={e => setForm({ ...form, pixKey: e.target.value })}
            required
            className="w-full mt-1 border border-pink-100 rounded-xl px-3 py-2"
          />
        </div>

        <button className="btn-primary" disabled={status === 'saving'}>
          {status === 'saving' ? 'Enviando...' : 'Solicitar Saque'}
        </button>

        {status === 'done' && <p className="text-sm text-green-600">Solicitação enviada!</p>}
        {status && status !== 'saving' && status !== 'done' && (
          <p className="text-sm text-pink-dark">{status}</p>
        )}
      </form>

      <div>
        <h3 className="font-bold text-gray-900 mb-3">Minhas Solicitações</h3>
        <div className="flex flex-col gap-2 max-w-xl">
          {pendingWithdrawals.map(w => (
            <div key={w.id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">R$ {Number(w.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{w.pixKeyType}: {w.pixKey}</p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Pendente</span>
            </div>
          ))}
          {pendingWithdrawals.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma solicitação pendente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
