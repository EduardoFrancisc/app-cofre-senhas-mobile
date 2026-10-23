import { create, type AxiosInstance } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { storage } from '@/utils/storage';

import { normalizeApiError } from './api-error';

export const JWT_TOKEN_KEY = 'cofre_jwt_token';

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

let cachedToken: string | null = null;
let isCacheReady = false;

async function readToken(): Promise<string | null> {
  if (!isCacheReady) {
    cachedToken = await storage.getItem(JWT_TOKEN_KEY);
    isCacheReady = true;
  }
  return cachedToken;
}

export function setTokenCache(token: string | null): void {
  cachedToken = token;
  isCacheReady = true;
}

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

export async function request<T>(config: Parameters<AxiosInstance['request']>[0], context: string): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, context);
  }
}

export default api;

