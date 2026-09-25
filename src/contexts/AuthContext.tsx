import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

import { authEvents, JWT_TOKEN_KEY } from '../services/api';
import * as authService from '../services/authService';
import type { AuthContextData, LoginCredentials, User } from '../types/auth.types';

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await storage.getItem(JWT_TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          // TODO: validar token em GET /auth/me e popular o objeto user
        }
      } catch (error) {
        console.error('[AuthContext] Falha ao restaurar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const unsubscribe = authEvents.on('unauthorized', () => signOut());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const { token: newToken, user: loggedUser } = await authService.login(credentials);
    await storage.setItem(JWT_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(loggedUser);
  }, []);

  const signOut = useCallback(async () => {
    await storage.deleteItem(JWT_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
