import { ApiError } from '@/services/api-error';

export interface UserFacingError {
  title: string;
  message?: string;
}

const TITLES = {
  network: 'Sem conexão',
  timeout: 'Tempo esgotado',
  unauthorized: 'Credenciais inválidas',
  forbidden: 'Acesso negado',
  notFound: 'Recurso não encontrado',
  // O único 409 desta API é e-mail duplicado no cadastro, e o backend manda
  // uma mensagem boa ("O e-mail informado já está cadastrado no sistema: ...").
  // Um título genérico de "Conflito" desperdiçaria essa informação.
  conflict: 'E-mail já cadastrado',
  validation: 'Dados inválidos',
  server: 'Servidor indisponível',
  canceled: 'Operação cancelada',
  unknown: 'Algo deu errado',
} as const;

/**
 * Traduz um `ApiError` em algo que faz sentido para o usuário.
 *
 * Preferimos um título curto e acionável; a mensagem técnica do servidor só
 * entra como detalhe quando acrescenta informação real.
 */
export function describeAuthError(error: unknown, fallbackTitle = 'Não foi possível continuar'): UserFacingError {
  if (!(error instanceof ApiError)) {
    return { title: fallbackTitle, message: 'Tente novamente em instantes.' };
  }

  const title = TITLES[error.kind] ?? fallbackTitle;

  // `network` e `timeout` já carregam uma mensagem útil e específica
  // (inclusive sobre a API local), então mostramos como está.
  if (error.kind === 'network' || error.kind === 'timeout') {
    return { title, message: error.message };
  }

  // Mensagens de 4xx do servidor costumam ser o melhor texto que temos.
  if (error.status !== undefined && error.status < 500) {
    return { title, message: error.message };
  }

  return { title, message: error.message };
}
