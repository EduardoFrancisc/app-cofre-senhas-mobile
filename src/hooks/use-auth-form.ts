import { useCallback, useState } from 'react';

import { ApiError, logApiError } from '@/services/api-error';
import { describeAuthError, type UserFacingError } from '@/utils/auth-error-message';
import { hasErrors, type FieldErrors } from '@/utils/validation';

interface UseAuthFormOptions<TValues, TField extends keyof TValues & string> {
  validate: (values: TValues) => FieldErrors<TValues>;
  /** Nome usado nos logs de diagnóstico. */
  context: string;
  fallbackErrorTitle: string;
  /** Aplica erros devolvidos pelo backend aos campos correspondentes. */
  mapServerFieldErrors?: (fieldErrors: Record<string, string>) => Partial<Record<TField, string>>;
}

/**
 * Estado e fluxo de um formulário de autenticação.
 *
 * Login e cadastro compartilham exatamente o mesmo comportamento: validar,
 * bloquear reenvio, mostrar erro de campo e erro de servidor. Centralizar isso
 * evita que os dois fluxos diverjam (era o que acontecia: só o login validava
 * o formato do e-mail, e só o login tratava erro de rede).
 */
export function useAuthForm<TValues, TField extends keyof TValues & string>({
  validate,
  context,
  fallbackErrorTitle,
  mapServerFieldErrors,
}: UseAuthFormOptions<TValues, TField>) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<TValues>>({});
  const [serverError, setServerError] = useState<UserFacingError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handler de mudança de um campo: grava o valor e limpa o erro associado.
   *
   * Sem isso, a mensagem de erro continua na tela depois de o usuário corrigir
   * o campo, e o formulário parece quebrado.
   *
   * ```tsx
   * <TextField onChangeText={handleFieldChange('email', setEmail)} ... />
   * ```
   */
  const handleFieldChange = useCallback(
    <K extends TField>(field: K, setValue: (value: TValues[K]) => void) =>
      (value: TValues[K]) => {
        setValue(value);
        setFieldErrors((current) => {
          if (current[field] === undefined) return current;
          const next = { ...current };
          delete next[field];
          return next;
        });
        setServerError(null);
      },
    []
  );

  const handleSubmit = useCallback(
    async (values: TValues, submit: (values: TValues) => Promise<void>) => {
      if (isSubmitting) return;

      const errors = validate(values);
      setFieldErrors(errors);
      setServerError(null);

      if (hasErrors(errors)) return;

      setIsSubmitting(true);
      try {
        await submit(values);
        setFieldErrors({});
      } catch (error) {
        if (error instanceof ApiError) {
          logApiError(error, context);
        }

        setServerError(describeAuthError(error, fallbackErrorTitle));

        const apiFieldErrors = extractFieldErrors(error);
        if (apiFieldErrors && mapServerFieldErrors) {
          setFieldErrors((current) => ({ ...current, ...mapServerFieldErrors(apiFieldErrors) }));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [fallbackErrorTitle, context, isSubmitting, mapServerFieldErrors, validate]
  );

  return { fieldErrors, serverError, isSubmitting, handleSubmit, handleFieldChange, setServerError };
}

function extractFieldErrors(error: unknown): Record<string, string> | undefined {
  if (typeof error === 'object' && error !== null && 'fieldErrors' in error) {
    const value = (error as { fieldErrors?: Record<string, string> }).fieldErrors;
    if (value && Object.keys(value).length > 0) return value;
  }
  return undefined;
}
