import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import * as authService from '@/services/authService';
import { ApiError, logApiError } from '@/services/api-error';
import { JWT_TOKEN_KEY, authEvents, setTokenCache } from '@/services/api';
import type { AuthContextData, LoginCredentials, RegisterPayload, RegisterResult, User } from '@/types/auth.types';
import { normalizeEmail } from '@/utils/validation';

import { storage } from '../utils/storage';

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistToken = useCallback((nextToken: string | null) => {
    setTokenCache(nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(async () => {
    await storage.deleteItem(JWT_TOKEN_KEY);
    setTokenCache(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const storedToken = await storage.getItem(JWT_TOKEN_KEY);

        if (cancelled || !storedToken) return;

        setTokenCache(storedToken);
        setToken(storedToken);

        const profile = await authService.fetchProfile('');

        if (!cancelled && profile.status === 'ok') {
          setUser(profile.user);
        }
      } catch (error) {
        const apiError = error instanceof ApiError ? error : null;
        logApiError(
          apiError ?? new ApiError({ kind: 'unknown', message: 'Falha ao restaurar a sessão.', cause: error }),
          'restore-session'
        );

        if (apiError?.kind === 'unauthorized') {
          await storage.deleteItem(JWT_TOKEN_KEY);
          setTokenCache(null);
          if (!cancelled) setToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => authEvents.on('unauthorized', () => void signOut()), [signOut]);

  const signIn = useCallback(
    async ({ email, password }: LoginCredentials) => {
      const { token: newToken, user: loggedUser } = await authService.login({ email, password });

      await storage.setItem(JWT_TOKEN_KEY, newToken);
      persistToken(newToken);

      if (loggedUser) {
        setUser(loggedUser);
        return;
      }

      try {
        const profile = await authService.fetchProfile(email);
        if (profile.status === 'ok') setUser(profile.user);
      } catch (error) {
        if (error instanceof ApiError) logApiError(error, 'sign-in-profile');
      }
    },
    [persistToken]
  );

  const signUp = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      await authService.register(payload);

      try {
        await signIn({ email: normalizeEmail(payload.email), password: payload.password });
        return { autoSignedIn: true };
      } catch {
        return { autoSignedIn: false };
      }
    },
    [signIn]
  );

  const value = useMemo(
    () => ({ user, token, isLoading, signIn, signUp, signOut }),
    [user, token, isLoading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
