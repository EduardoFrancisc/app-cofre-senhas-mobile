import { create, type AxiosInstance } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { storage } from '@/utils/storage';

import { normalizeApiError } from './api-error';

export const JWT_TOKEN_KEY = 'cofre_jwt_token';

/**
 * Rotas cujo `401` **não** encerra a sessão automaticamente.
 *
 * Duas situações distintas:
 * - `/auth/login` e `/usuarios`: um 401 aqui significa credenciais inválidas.
 *   Disparar `unauthorized` chamaria `signOut()`, apagando a sessão e
 *   mascarando a causa real do erro.
 * - `/auth/me`: o perfil é consultado em dois momentos (cold start e pós-login)
 *   e cada chamador trata o 401 por conta própria, com o contexto certo.
 */
const NON_INVALIDATING_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/usuarios', '/auth/me'] as const;

function getRequestUrl(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('config' in error)) return undefined;
  return (error as { config?: { url?: string } }).config?.url;
}

function shouldInvalidateSession(error: unknown): boolean {
  const status =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;

  if (status !== 401) return false;

  const url = getRequestUrl(error);
  return !url || !NON_INVALIDATING_PATHS.some((path) => url.includes(path));
}

const api: AxiosInstance = create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/* -------------------------------------------------------------------------- */
/*                            Cache do token                                  */
/* -------------------------------------------------------------------------- */

/**
 * O interceptor de request é síncrono no axios v1, então não dá para fazer
 * `await storage.getItemAsync` a cada chamada sem adicionar latência. Mantemos
 * o token em memória e invalidamos o cache quando ele muda.
 */
let cachedToken: string | null = null;
let isCacheReady = false;

async function readToken(): Promise<string | null> {
  if (!isCacheReady) {
    cachedToken = await storage.getItem(JWT_TOKEN_KEY);
    isCacheReady = true;
  }
  return cachedToken;
}

/** Mantém o cache em sincronia com o storage. Chamar sempre que o token mudar. */
export function setTokenCache(token: string | null): void {
  cachedToken = token;
  isCacheReady = true;
}

/* -------------------------------------------------------------------------- */
/*                              Interceptadores                               */
/* -------------------------------------------------------------------------- */

api.interceptors.request.use(async (config) => {
  const token = await readToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (shouldInvalidateSession(error)) {
      authEvents.emit('unauthorized');
    }
    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/*                             Eventos de sessão                              */
/* -------------------------------------------------------------------------- */

type AuthEventType = 'unauthorized';

const listeners = new Map<AuthEventType, Set<() => void>>();

export const authEvents = {
  on(event: AuthEventType, listener: () => void): () => void {
    let bucket = listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      listeners.set(event, bucket);
    }
    bucket.add(listener);

    return () => {
      bucket.delete(listener);
    };
  },

  emit(event: AuthEventType): void {
    listeners.get(event)?.forEach((listener) => listener());
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Request                                  */
/* -------------------------------------------------------------------------- */

/**
 * Executa uma requisição e devolve apenas o corpo da resposta.
 * Todo erro sai daqui como `ApiError` — as telas nunca recebem axios cru.
 */
export async function request<T>(config: Parameters<AxiosInstance['request']>[0], context: string): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, context);
  }
}

export default api;
