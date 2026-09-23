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
      navigate(user.role === 'SELLER' ? '/loja/configuracoes' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--da-surface)' }}>
      <form onSubmit={handleSubmit} className="da-card" style={{ width: 360, display: 'grid', gap: 12 }}>
        <h2 style={{ color: 'var(--da-primary)', margin: 0 }}>Criar conta</h2>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'CLIENT' })}
            className={form.role === 'CLIENT' ? 'da-btn' : 'da-btn da-btn-outline'}
            style={{ flex: 1 }}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'SELLER' })}
            className={form.role === 'SELLER' ? 'da-btn' : 'da-btn da-btn-outline'}
            style={{ flex: 1 }}
          >
            Vendedor
          </button>
        </div>

        <input
          placeholder="Nome completo"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          style={{ padding: 10, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          style={{ padding: 10, borderRadius: 'var(--da-radius-sm)', border: '1px solid var(--da-border)' }}
        />
        <input
          placeholder="Telefone (WhatsApp)"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
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

        {form.role === 'SELLER' && (
          <p style={{ fontSize: 12, color: 'var(--da-text-muted)', margin: 0 }}>
            Vendedores passam por verificação de identidade (KYC) após o cadastro.
          </p>
        )}

        {error && <p style={{ color: '#c4104f', fontSize: 13, margin: 0 }}>{error}</p>}

        <button className="da-btn" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>

        <p style={{ fontSize: 13, textAlign: 'center', margin: 0 }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--da-primary)' }}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}
