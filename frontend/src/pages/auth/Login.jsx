import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'ADMIN' || user.role === 'SUPPORT' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-soft to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-pink-100 p-8 md:p-10">
        <div className="flex justify-center mb-6">
          <img src="/assets/logo.png" alt="Divide Aí" className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Bem-vindo de volta</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Entre na sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-neon focus:border-transparent transition-shadow"
              placeholder="seu@email.com"
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
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-pink-dark bg-pink-soft border border-pink-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            className="w-full bg-pink-neon text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-dark hover:shadow-lg active:scale-[0.99] transition-all"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-pink-neon font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
