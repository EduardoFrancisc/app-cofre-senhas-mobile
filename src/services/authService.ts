import { DEFAULT_USER_ROLE, PROFILE_ENDPOINT } from '@/config/env';
import { normalizeEmail } from '@/utils/validation';

import type { AuthResponse, LoginCredentials, RegisterPayload, User } from '../types/auth.types';

import { request } from './api';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const email = normalizeEmail(credentials.email);

  const data = await request<Record<string, unknown>>(
    {
      method: 'POST',
      url: '/auth/login',
      data: { email, senha: credentials.password },
    },
    'login'
  );

  const token = pickToken(data);
  if (!token) {
    throw new Error('login: a resposta da API não continha um token.');
  }

  return {
    token,
    user: pickUser(data, email),
    expiresIn: pickExpiresIn(data),
  };
}

export async function register(payload: RegisterPayload): Promise<void> {
  await request<unknown>(
    {
      method: 'POST',
      url: '/usuarios',
      data: {
        nome: payload.name.trim(),
        email: normalizeEmail(payload.email),
        senha: payload.password,
        tipoUsuario: DEFAULT_USER_ROLE,
      },
    },
    'register'
  );
}

export type ProfileResult =
  | { status: 'ok'; user: User }
  | { status: 'unsupported' };

export async function fetchProfile(emailHint: string): Promise<ProfileResult> {
  if (!PROFILE_ENDPOINT) return { status: 'unsupported' };

  try {
    const data = await request<Record<string, unknown>>({ method: 'GET', url: PROFILE_ENDPOINT }, 'profile');
    const user = pickUser(data, emailHint);
    return user ? { status: 'ok', user } : { status: 'unsupported' };
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404 || status === 405 || status === 501) {
      return { status: 'unsupported' };
    }
    throw error;
  }
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function pickToken(data: Record<string, unknown>): string | undefined {
  return pickString(data, ['token', 'accessToken', 'access_token', 'jwt']);
}

function pickExpiresIn(data: Record<string, unknown>): number | undefined {
  const expirationMs = data.expiracaoEm ?? data.expiresAtMs;
  if (typeof expirationMs === 'number' || (typeof expirationMs === 'string' && /^\d+$/.test(expirationMs))) {
    const ms = Number(expirationMs);
    if (Number.isFinite(ms) && ms > 0) {
      return Math.round((ms - Date.now()) / 1000);
    }
  }

  const seconds = pickString(data, ['expiresIn', 'expires_in', 'expiresInSeconds']);
  if (seconds === undefined) return undefined;

  const parsed = Number(seconds);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pickUser(data: Record<string, unknown>, emailHint: string): User | null {
  const nested = (data.user ?? data.usuario ?? data.account) as Record<string, unknown> | undefined;
  const source = nested && typeof nested === 'object' ? nested : data;

  const name = pickString(source, ['name', 'nome', 'displayName', 'fullName']);
  if (!name) return null;

  return {
    id: pickString(source, ['id', 'userId', 'usuarioId']) ?? emailHint,
    name,
    email: pickString(source, ['email', 'login']) ?? emailHint,
  };
}

