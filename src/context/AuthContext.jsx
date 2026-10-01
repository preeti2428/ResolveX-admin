'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on client mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('resolvex_token');
      const storedUser = localStorage.getItem('resolvex_user');
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error('Storage reading error:', e);
    }
  }, []);

  // Verify session on token change
  useEffect(() => {
    async function verifyToken() {
      if (token) {
        try {
          const res = await apiRequest('/api/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('resolvex_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Session verify failed:', err);
          logout();
        }
      }
      setLoading(false);
    }

    if (token !== null) {
      verifyToken();
    } else {
      // Small timeout to allow client mount
      const timer = setTimeout(() => setLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const login = async (email, password, role) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (res.success && res.token) {
      localStorage.setItem('resolvex_token', res.token);
      localStorage.setItem('resolvex_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginWithGoogle = async (googleToken) => {
    const res = await apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });

    if (res.success && res.token) {
      localStorage.setItem('resolvex_token', res.token);
      localStorage.setItem('resolvex_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    try {
      localStorage.removeItem('resolvex_token');
      localStorage.removeItem('resolvex_user');
    } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
