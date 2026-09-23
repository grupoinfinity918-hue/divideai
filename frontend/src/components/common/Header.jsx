import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/assets/logo.png" alt="Divide Aí" className="h-10 w-auto" />
        </Link>

        {!isAuthenticated ? (
          <Link to="/login" className="btn-primary text-sm">
            Faça Login ou Cadastre-se
          </Link>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 font-semibold text-gray-800 hover:text-pink-neon transition-colors"
            >
              Olá, {user.name?.split(' ')[0]}
              <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-pink-100 rounded-xl shadow-lg overflow-hidden">
                <Link to="/minhas-compras" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm hover:bg-pink-soft">
                  Minhas Compras
                </Link>
                <Link to="/loja" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm hover:bg-pink-soft">
                  Meu Painel da Loja (Mini-CRM)
                </Link>
                {(user.role === 'ADMIN' || user.role === 'SUPPORT') && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm hover:bg-pink-soft">
                    Painel Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-pink-dark hover:bg-pink-soft border-t border-pink-100">
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
