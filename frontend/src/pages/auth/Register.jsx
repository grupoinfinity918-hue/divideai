import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CLIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'SELLER' ? '/loja' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-soft to-white px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-pink-100 p-8 md:p-10">
        <div className="flex justify-center mb-6">
          <img src="/assets/logo.png" alt="Divide Aí" className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Criar conta</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Leva menos de um minuto</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2 bg-pink-soft p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'CLIENT' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                form.role === 'CLIENT' ? 'bg-white text-pink-neon shadow-sm' : 'text-gray-500'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'SELLER' })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                form.role === 'SELLER' ? 'bg-white text-pink-neon shadow-sm' : 'text-gray-500'
              }`}
            >
              Vendedor
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Nome completo</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-neon focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-neon focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Telefone (WhatsApp)</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-neon focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-neon focus:border-transparent transition-shadow"
            />
          </div>

          {form.role === 'SELLER' && (
            <p className="text-xs text-gray-500 bg-pink-soft rounded-xl px-3 py-2">
              Vendedores passam por verificação de identidade (KYC) após o cadastro.
            </p>
          )}

          {error && (
            <p className="text-sm text-pink-dark bg-pink-soft border border-pink-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            className="w-full bg-pink-neon text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-dark hover:shadow-lg active:scale-[0.99] transition-all"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-pink-neon font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
