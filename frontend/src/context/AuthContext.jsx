import { createContext, useContext, useEffect, useState, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnread();
      pollRef.current = setInterval(loadUnread, 15000);
      return () => clearInterval(pollRef.current);
    }
    setUnreadCount(0);
  }, [user]);

  async function loadUnread() {
    const token = localStorage.getItem('da_token');
    if (!token) return;
    try {
      const res = await fetch('/api/chats/unread-count', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignora falha de polling
    }
  }

  async function loadMe() {
    const token = localStorage.getItem('da_token');
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setUser(await res.json());
    else localStorage.removeItem('da_token');
    setLoading(false);
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
    localStorage.setItem('da_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
    localStorage.setItem('da_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('da_token');
    setUser(null);
  }

  async function refreshUser() {
    const token = localStorage.getItem('da_token');
    if (!token) return;
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUser(await res.json());
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, unreadCount, refreshUnread: loadUnread, refreshUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function authHeader() {
  const token = localStorage.getItem('da_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
