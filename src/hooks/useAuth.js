import { useState, useEffect } from 'react';

const API_BASE = '/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('session_token') || null);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [token]);

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/url`);
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      console.error("Error fetching login URL:", e);
    }
  };

  const handleCallback = async (code) => {
    try {
      const res = await fetch(`${API_BASE}/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.session_token);
        setUser(data.user);
        localStorage.setItem('session_token', data.session_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
    } catch (e) {
      console.error("Error in auth callback:", e);
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
  };

  return { user, token, login, logout, handleCallback };
}
