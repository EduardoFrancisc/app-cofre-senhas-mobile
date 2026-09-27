import { IS_LOCAL_API } from '@/config/env';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'unknown';

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  /** Mensagem já amigável para o usuário final. */
  message: string;
  /** Erros por campo vindos do backend (ex.: `{ email: "E-mail já cadastrado" }`). */
  fieldErrors?: Record<string, string>;
  cause?: unknown;
}

/**
 * Erro de API normalizado.
 *
 * A tela nunca deve inspecionar `error.response.status` diretamente —
 * essa lógica fica concentrada aqui, em `normalizeApiError`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor({ kind, status, message, fieldErrors, cause }: ApiErrorOptions) {
    super(message, { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 422 || (status >= 400 && status < 500)) return 'validation';
  return 'server';
}

/**
 * Extrai `{ campo: "mensagem" }` dos formatos de erro mais comuns.
 *
 * O backend deste projeto responde:
 * ```json
 * { "erro": "Erro de validação...", "campos": [{ "campo": "senha", "mensagem": "..." }] }
 * ```
 * Também cobrimos Spring Boot padrão, APIs em inglês e formatos flattened
 * (`{ fields: { email: "..." } }`), para não acoplar a UI a um formato só.
 */
function extractFieldErrors(data: unknown): Record<string, string> | undefined {
  if (typeof data !== 'object' || data === null) return undefined;

  const record = data as Record<string, unknown>;

  // Listas de { campo, mensagem } — formato do backend deste projeto.
  const listCandidates = [record.campos, record.errors, record.fieldErrors, record.violations];

  for (const candidate of listCandidates) {
    if (!Array.isArray(candidate)) continue;

    const result: Record<string, string> = {};
    for (const item of candidate) {
      if (typeof item !== 'object' || item === null) continue;

      const entry = item as Record<string, unknown>;
      const field = entry.campo ?? entry.field ?? entry.fieldName ?? entry.property;
      const message = entry.mensagem ?? entry.message ?? entry.defaultMessage;

      if (typeof field === 'string' && typeof message === 'string') {
        result[field] = message;
      }
    }

    if (Object.keys(result).length > 0) return result;
  }

  // Objetos { email: "..." } — formato flattened.
  const mapCandidates = [record.fieldErrors, record.fields, record.erros];

  for (const candidate of mapCandidates) {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) continue;

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
      if (typeof value === 'string') result[key] = value;
    }

    if (Object.keys(result).length > 0) return result;
  }

  return undefined;
}

/** Extrai a mensagem principal do corpo da resposta, se houver. */
function extractMessage(data: unknown): string | undefined {
  if (typeof data === 'string' && data.trim().length > 0) return data;
  if (typeof data !== 'object' || data === null) return undefined;

  const record = data as Record<string, unknown>;
  for (const key of ['erro', 'error', 'message', 'detail', 'title']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
}

const GENERIC_SERVER_MESSAGE = 'O serviço está indisponível agora. Tente novamente em instantes.';

/**
 * Converte qualquer erro (axios, rede, JSON malformado) em `ApiError`,
 * com mensagem appropriate para o contexto e o ambiente.
 */
export function normalizeApiError(error: unknown, context: string): ApiError {
  if (error instanceof ApiError) return error;

  // axios.isAxiosError sem importar axios aqui, para manter este módulo puro.
  const isAxiosError =
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true;

  if (!isAxiosError) {
    return new ApiError({
      kind: 'unknown',
      message: 'Não foi possível concluir a operação. Tente novamente.',
      cause: error,
    });
  }

  const axiosError = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  // Sem resposta = não houve handshake com o servidor (DNS, servidor fora, CORS).
  if (status === undefined) {
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new ApiError({
        kind: 'timeout',
        message: 'A requisição demorou demais para responder. Verifique sua conexão.',
        cause: error,
      });
    }

    return new ApiError({
      kind: 'network',
      message: IS_LOCAL_API
        ? 'Não foi possível conectar à API local. Ela está rodando e o endereço em EXPO_PUBLIC_API_URL está correto?'
        : 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      cause: error,
    });
  }

  const fieldErrors = extractFieldErrors(data);
  const serverMessage = extractMessage(data);

  return new ApiError({
    kind: kindFromStatus(status),
    status,
    message: serverMessage ?? GENERIC_SERVER_MESSAGE,
    fieldErrors,
    cause: error,
  });
}

/** Log de diagnóstico, ativo apenas em desenvolvimento. */
export function logApiError(error: ApiError, context: string): void {
  if (!__DEV__) return;
  console.warn(`[api:${context}] ${error.kind}${error.status ? ` (${error.status})` : ''}: ${error.message}`);
}
