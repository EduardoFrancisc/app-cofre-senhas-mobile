import { Platform } from 'react-native';

const DEV_FALLBACK_PORT = 8080;

/**
 * O host padrão depende de onde o app está rodando:
 *
 * - Web e simulador iOS: `localhost` resolve para a máquina do desenvolvedor.
 * - Emulador Android: `localhost` resolve para o próprio dispositivo, então
 *   o loopback do host é exposto pelo AVD em `10.0.2.2`.
 * - Celular físico: nenhum dos dois funciona — defina `EXPO_PUBLIC_API_URL`
 *   no `.env.local` com o IP da sua máquina na rede local (ex.: `http://192.168.0.10:8080`).
 */
function getDevFallbackUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${DEV_FALLBACK_PORT}`;
}

/**
 * A URL base da API.
 *
 * Vem de `EXPO_PUBLIC_API_URL` (ver `.env.example`). O fallback serve apenas
 * para desenvolvimento local — **sempre** defina a variável antes de publicar.
 *
 * > Cuidado: variáveis `EXPO_PUBLIC_*` são embutidas em texto plano no bundle.
 * > Nunca coloque segredos aqui.
 */
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = (
  configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : getDevFallbackUrl()
).replace(/\/+$/, '');

const configuredTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;

/** Timeout de rede em milissegundos. Padrão: 15s (5s é curto demais em redes móveis). */
export const API_TIMEOUT_MS = configuredTimeout ? Number(configuredTimeout) : 15_000;

/**
 * `true` quando estamos falando com um backend local. Útil para mensagens
 * de erro mais honestas ("a API local está rodando?").
 */
export const IS_LOCAL_API =
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('10.0.2.2');

/* -------------------------------------------------------------------------- */
/*                              Papéis de usuário                              */
/* -------------------------------------------------------------------------- */

/** Espelha o enum `TipoUsuario` do backend. */
export const USER_ROLES = ['ADMIN', 'USUARIO_LEIGO'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Papel enviado no cadastro (`POST /usuarios`).
 *
 * O backend exige o campo, então ele precisa ser enviado — mas o padrão é
 * **`USUARIO_LEIGO`**, o menos privilegiado.
 *
 * O padrão **nunca** é `ADMIN`: se o app mandasse ADMIN, qualquer pessoa
 * poderia se cadastrar como administradora bastando trocar um valor no
 * cliente. Para criar contas administrativas de propósito (seed, ambiente de
 * testes), defina `EXPO_PUBLIC_TIPO_USUARIO_PADRAO=ADMIN` — sabendo que isso
 * também reabre a porta para qualquer outro.
 */
const configuredRole = process.env.EXPO_PUBLIC_TIPO_USUARIO_PADRAO;

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.includes(configuredRole as UserRole)
  ? (configuredRole as UserRole)
  : 'USUARIO_LEIGO';

/* -------------------------------------------------------------------------- */
/*                        Perfil do usuário logado                            */
/* -------------------------------------------------------------------------- */

/**
 * Endpoint que devolve o usuário a partir do token (ex.: `/auth/me`).
 *
 * **Vazio por padrão.** A API deste projeto não tem essa rota — chamá-la
 * resultava em um 500 nos logs do servidor a cada abertura do app e a cada
 * login, sem trazer nenhum dado.
 *
 * Ative apenas quando o backend expuser o endpoint:
 * ```bash
 * EXPO_PUBLIC_PROFILE_ENDPOINT=/auth/me
 * ```
 * Enquanto isso, a sessão funciona normalmente e a tela inicial mostra um
 * nome genérico.
 */
const configuredProfileEndpoint = process.env.EXPO_PUBLIC_PROFILE_ENDPOINT;

export const PROFILE_ENDPOINT: string | null =
  configuredProfileEndpoint && configuredProfileEndpoint.trim().length > 0
    ? configuredProfileEndpoint.trim()
    : null;
