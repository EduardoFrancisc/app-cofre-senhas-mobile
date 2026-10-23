import { Platform } from 'react-native';

const DEV_FALLBACK_PORT = 8080;

function getDevFallbackUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${DEV_FALLBACK_PORT}`;
}

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = (
  configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : getDevFallbackUrl()
).replace(/\/+$/, '');

const configuredTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;

export const API_TIMEOUT_MS = configuredTimeout ? Number(configuredTimeout) : 15_000;

export const IS_LOCAL_API =
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('10.0.2.2');

export const USER_ROLES = ['ADMIN', 'USUARIO_LEIGO'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const configuredRole = process.env.EXPO_PUBLIC_TIPO_USUARIO_PADRAO;

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.includes(configuredRole as UserRole)
  ? (configuredRole as UserRole)
  : 'USUARIO_LEIGO';

const configuredProfileEndpoint = process.env.EXPO_PUBLIC_PROFILE_ENDPOINT;

export const PROFILE_ENDPOINT: string | null =
  configuredProfileEndpoint && configuredProfileEndpoint.trim().length > 0
    ? configuredProfileEndpoint.trim()
    : '/auth/me';


