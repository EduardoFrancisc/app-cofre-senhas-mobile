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

  // Restaura a sessão salva. Roda uma única vez, no cold start.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const storedToken = await storage.getItem(JWT_TOKEN_KEY);

        if (cancelled) return;
        if (!storedToken) return;

        setTokenCache(storedToken);
        setToken(storedToken);

        // Se o backend ainda não tiver `/auth/me`, mantemos a sessão mesmo
        // assim — só o nome do usuário fica indisponível.
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

        // Token inválido ou expirado: descarta para não ficar preso numa
        // sessão que nenhuma requisição vai aceitar.
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

  // Encerra a sessão quando a API responde 401 fora dos endpoints públicos.
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

      // O login não devolve o perfil. Buscamos agora para que a interface
      // não fique mostrando "Olá, usuário" até o próximo cold start.
      // Falhar aqui não invalida o login: o token já está válido.
      try {
        const profile = await authService.fetchProfile(email);
        if (profile.status === 'ok') setUser(profile.user);
      } catch (error) {
        if (error instanceof ApiError) logApiError(error, 'sign-in-profile');
      }
    },
    [persistToken]
  );

  /**
   * Cadastra a conta e, em seguida, faz o login automaticamente.
   *
   * O auto-login é uma conveniência: se a conta for criada com sucesso mas ainda
   * não puder ser autenticada (ex.: aguardando verificação de e-mail), caímos no
   * login manual em vez de mostrar um erro para o usuário.
   */
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
