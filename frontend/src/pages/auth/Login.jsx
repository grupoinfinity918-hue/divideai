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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--da-surface)' }}>
      <form onSubmit={handleSubmit} className="da-card" style={{ width: 340, display: 'grid', gap: 12 }}>
        <h2 style={{ color: 'var(--da-primary)', margin: 0 }}>Entrar no Divide Aí</h2>

        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          style={{ padding: 10, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          style={{ padding: 10, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
        />

        {error && <p style={{ color: '#c4104f', fontSize: 13, margin: 0 }}>{error}</p>}

        <button className="da-btn" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>

        <p style={{ fontSize: 13, textAlign: 'center', margin: 0 }}>
          Não tem conta? <Link to="/cadastro" style={{ color: 'var(--da-primary)' }}>Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
