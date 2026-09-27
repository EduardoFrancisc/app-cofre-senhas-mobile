export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  /**
   * O endpoint de login do backend não devolve o usuário (só um
   * `TokenResponseDTO`). Quando ele vier no corpo, usamos; caso contrário
   * buscamos em `/auth/me` ou derivamos do e-mail informado.
   */
  user: User | null;
  /** Segundos até a expiração, quando o backend informar. */
  expiresIn?: number;
}

export interface RegisterResult {
  /** `true` quando o login foi feito automaticamente após o cadastro. */
  autoSignedIn: boolean;
}

export interface AuthContextData {
  user: User | null;
  token: string | null;
  /** `true` apenas durante a restauração inicial da sessão. */
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<RegisterResult>;
  signOut: () => Promise<void>;
}
