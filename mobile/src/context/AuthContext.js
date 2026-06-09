import React, { createContext, useState, useEffect } from 'react';
import { salvarAuth, lerAuth, limparAuth } from '../database/db';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão do banco local ao iniciar o app
  useEffect(() => {
    const auth = lerAuth();
    if (auth) {
      setTokenState(auth.token);
      setUser(auth.user);
      setAuthToken(auth.token);
    }
    setLoading(false);
  }, []);

  /** Chamado após login/registro bem-sucedido. */
  function login(newToken, userData) {
    salvarAuth(newToken, userData);
    setAuthToken(newToken);
    setTokenState(newToken);
    setUser(userData);
  }

  /** Chamado no logout. */
  function logout() {
    limparAuth();
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
