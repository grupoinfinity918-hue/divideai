import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--da-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="da-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px'
      }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 22, color: 'var(--da-primary)', textDecoration: 'none' }}>
          Divide Aí
        </Link>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/loja/atendimentos" className="da-btn da-btn-outline">Painel da Loja</Link>
          <Link to="/admin" className="da-btn">Admin</Link>
        </nav>
      </div>

      <img
        src="/assets/logo.png"
        alt="divideAí"
        style={{
          position: 'fixed',
          top: 10,
          right: 16,
          height: 36,
          zIndex: 60,
          pointerEvents: 'none'
        }}
      />
    </header>
  );
}
