import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * `expo-secure-store` não tem implementação na web, então usamos
 * `localStorage` como fallback.
 *
 * Na web isso é aceitável apenas em desenvolvimento: o token fica legível
 * por qualquer script da página. Em produção o app é nativo, onde o
 * SecureStore usa o Keychain do iOS e o EncryptedSharedPreferences do Android.
 */

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return safeLocalStorage(() => localStorage.getItem(key), null);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    safeLocalStorage<void>(() => localStorage.setItem(key, value), undefined);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    safeLocalStorage<void>(() => localStorage.removeItem(key), undefined);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Safari em modo privado e alguns WebViews lançam ao acessar `localStorage`.
 * Um token ilegível não deve derrubar a tela de login, então degradamos
 * para o valor padrão.
 */
function safeLocalStorage<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    if (__DEV__) console.warn('[storage] localStorage indisponível:', error);
    return fallback;
  }
}

export const storage = { getItem, setItem, deleteItem };
