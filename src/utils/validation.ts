/** Mensagens e regras de validação compartilhadas entre login e cadastro. */

import type { LoginCredentials, RegisterPayload } from '@/types/auth.types';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Limites espelhando as restrições do backend (`UsuarioRequestDTO`), para
 * falhar no formulário em vez de receber um 400 do servidor.
 * Ver `/v3/api-docs` da sua API: `nome` 2..100, `senha` >= 8.
 */
export const LIMITS = {
  name: { min: 3, max: 100 },
  password: { min: MIN_PASSWORD_LENGTH },
} as const;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** `true` quando existe pelo menos um erro no formulário. */
export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}

export function validateRequired(value: string, label: string): string | undefined {
  if (value.trim().length === 0) return `${label} é obrigatório.`;
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const required = validateRequired(email, 'O e-mail');
  if (required) return required;

  if (!EMAIL_REGEX.test(email.trim())) return 'Informe um e-mail válido, como nome@dominio.com.';
  return undefined;
}

export function validatePassword(password: string, label = 'A senha'): string | undefined {
  if (password.length === 0) return `${label} é obrigatória.`;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  // Uma senha só de espaços passa no length, mas é inútil.
  if (password.trim().length === 0) return 'A senha não pode ser apenas espaços.';
  return undefined;
}

export function validateName(name: string): string | undefined {
  const required = validateRequired(name, 'O nome');
  if (required) return required;

  if (name.trim().length < LIMITS.name.min) return 'Informe seu nome completo.';
  if (name.trim().length > LIMITS.name.max) {
    return `O nome deve ter no máximo ${LIMITS.name.max} caracteres.`;
  }
  return undefined;
}

/**
 * Recorta um e-mail para uso como login: minúsculo e sem espaços nas pontas.
 * O backend trata e-mail como identificador único, então normalizar evita
 * falhas por diferença de caixa.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*                          Validação por formulário                          */
/* -------------------------------------------------------------------------- */

export const LOGIN_RULES = {
  minPasswordLength: 1,
} as const;

export function validateLoginForm(values: LoginCredentials): FieldErrors<LoginCredentials> {
  const errors: FieldErrors<LoginCredentials> = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (values.password.length === 0) errors.password = 'A senha é obrigatória.';

  return errors;
}

export function validateRegisterForm(values: RegisterPayload): FieldErrors<RegisterPayload> {
  const errors: FieldErrors<RegisterPayload> = {};

  const nameError = validateName(values.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  return errors;
}

/* -------------------------------------------------------------------------- */
/*                            Força da senha                                  */
/* -------------------------------------------------------------------------- */

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrength;
  /** 0 a 4 — conveniente para desenhar um medidor. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const STRENGTH_LABELS: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'Fraca',
  fair: 'Razoável',
  good: 'Boa',
  strong: 'Forte',
};

/**
 * Avaliação heurística e apenas **informativa** — nunca bloqueia o cadastro.
 * Os critérios (minúsculas, maiúsculas, dígitos, símbolos, comprimento) seguem
 * as recomendações do NIST SP 800-63B, que prioriza comprimento sobre composição.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) {
    return { level: 'empty', score: 0, label: '' };
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1;

  // Senhas longas com variedade de caracteres nunca devem parecer fracas.
  if (password.length >= 16) score = Math.max(score, 3);

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const level = (['weak', 'fair', 'good', 'strong'] as const)[clamped - 1] ?? 'weak';

  return { level, score: clamped, label: STRENGTH_LABELS[level] };
}
