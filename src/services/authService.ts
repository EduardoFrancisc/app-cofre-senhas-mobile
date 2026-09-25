import api from './api';
import type { AuthResponse, LoginCredentials, RegisterPayload } from '../types/auth.types';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post('/auth/register', payload);
}
