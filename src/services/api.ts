import axios from 'axios';
import { storage } from '../utils/storage';

export const JWT_TOKEN_KEY = 'cofre_jwt_token';

// Android Emulator → 10.0.2.2 | iOS Simulator → localhost | Dispositivo físico → IP da rede local
const BASE_URL = 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(JWT_TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      authEvents.emit('unauthorized');
    }
    return Promise.reject(error);
  }
);

type AuthEventType = 'unauthorized';
type AuthListener = () => void;

const listeners = new Map<AuthEventType, Set<AuthListener>>();

export const authEvents = {
  on(event: AuthEventType, listener: AuthListener) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener);
    return () => {
      listeners.get(event)?.delete(listener);
    };
  },
  emit(event: AuthEventType) {
    listeners.get(event)?.forEach((listener) => listener());
  },
};

export default api;
