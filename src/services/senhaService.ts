import { request } from './api';

export interface Senha {
  id: string | number;
  titulo: string;
  login: string;
  senha?: string;
  url?: string;
  observacoes?: string;
  usuarioId?: string | number;
}

export interface CriarSenhaPayload {
  titulo: string;
  login: string;
  senha: string;
  url?: string;
  observacoes?: string;
}

function extractList(data: unknown): Senha[] {
  if (Array.isArray(data)) return data as Senha[];
  if (typeof data !== 'object' || data === null) return [];

  const record = data as Record<string, unknown>;
  const candidates = [record.data, record.content, record.senhas, record.items, record.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Senha[];
  }
  return [];
}

export async function listarSenhas(): Promise<Senha[]> {
  const data = await request<unknown>({ method: 'GET', url: '/api/senhas' }, 'listar-senhas');
  return extractList(data);
}

/**
 * Busca uma credencial específica pelo id.
 * Usado para revelar a senha após reautenticação do usuário.
 */
export async function buscarSenha(id: Senha['id']): Promise<Senha> {
  const data = await request<unknown>({ method: 'GET', url: `/api/senhas/${id}` }, 'buscar-senha');
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as Senha;
  }
  throw new Error('buscarSenha: resposta inesperada da API.');
}

/**
 * Exclui uma credencial do cofre.
 */
export async function excluirSenha(id: Senha['id']): Promise<void> {
  await request<unknown>({ method: 'DELETE', url: `/api/senhas/${id}` }, 'excluir-senha');
}

export async function criarSenha(payload: CriarSenhaPayload): Promise<Senha> {
  const data = await request<unknown>(
    {
      method: 'POST',
      url: '/api/senhas',
      data: {
        titulo: payload.titulo.trim(),
        login: payload.login.trim(),
        senha: payload.senha,
        url: payload.url?.trim() || undefined,
        observacoes: payload.observacoes?.trim() || undefined,
      },
    },
    'criar-senha'
  );

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as Senha;
  }
  return { id: '', titulo: payload.titulo, login: payload.login } as Senha;
}
