import { DEFAULT_USER_ROLE, PROFILE_ENDPOINT } from '@/config/env';
import { normalizeEmail } from '@/utils/validation';

import type { AuthResponse, LoginCredentials, RegisterPayload, User } from '../types/auth.types';

import { request } from './api';

/* -------------------------------------------------------------------------- */
/*                                  Login                                     */
/* -------------------------------------------------------------------------- */

/**
 * O backend usa nomes de campo em português e o login devolve um
 * `TokenResponseDTO`. Essa camada é a **única** que conhece esse contrato;
 * nenhuma tela fala português com a API.
 */
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

/* -------------------------------------------------------------------------- */
/*                                 Cadastro                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cria uma conta.
 *
 * `tipoUsuario` é **obrigatório** no `UsuarioRequestDTO` do backend, então
 * precisa ser enviado — mas o valor vem de `DEFAULT_USER_ROLE`, cujo padrão é
 * `USUARIO_LEIGO` (o menos privilegiado).
 *
 * Não fixamos `ADMIN` aqui: isso permitiria que qualquer pessoa se cadastrasse
 * como administradora bastando alterar um valor no cliente. Se você realmente
 * precisa criar admins pelo app, defina `EXPO_PUBLIC_TIPO_USUARIO_PADRAO=ADMIN`
 * e entenda o risco.
 */
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

/* -------------------------------------------------------------------------- */
/*                              Sessão / perfil                               */
/* -------------------------------------------------------------------------- */

export type ProfileResult =
  | { status: 'ok'; user: User }
  /** O backend ainda não expõe a rota de perfil. */
  | { status: 'unsupported' };

/**
 * Busca o usuário logado a partir do token salvo.
 *
 * Só faz requisição se `EXPO_PUBLIC_PROFILE_ENDPOINT` estiver configurado — a
 * API deste projeto não tem rota de perfil, e chamá-la sem necessidade gerava
 * um 500 no servidor a cada abertura e a cada login.
 *
 * Quando ativado, um 404/405/501 é tratado como "não suportado" em vez de
 * erro, para a sessão ser mantida mesmo assim.
 */
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

/* -------------------------------------------------------------------------- */
/*                          Leitura defensiva da resposta                      */
/* -------------------------------------------------------------------------- */

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

/** O token pode chegar como `token`, `accessToken`, `access_token` ou `jwt`. */
function pickToken(data: Record<string, unknown>): string | undefined {
  return pickString(data, ['token', 'accessToken', 'access_token', 'jwt']);
}

/**
 * O `TokenResponseDTO` do backend devolve `expiracaoEm` em **epoch
 * milissegundos** (ex.: `1790619034000`). Também aceitamos `expiresIn`, que
 * em vários backends já vem em segundos.
 *
 * @returns segundos restantes, ou `undefined` se o backend não informar.
 */
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

/**
 * Alguns backends já devolvem o usuário junto do token; outros não.
 *
 * Quando o nome não vem do servidor, retornamos `null` em vez de inventar um.
 * A tela exibe um fallback genérico até que exista um endpoint de perfil —
 * mostrar um nome deduzido do e-mail seria mentir sobre o que sabemos.
 */
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
