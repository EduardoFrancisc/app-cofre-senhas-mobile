import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

function safeLocalStorage<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    if (__DEV__) console.warn('[storage] localStorage indisponível:', error);
    return fallback;
  }
}

export const storage = { getItem, setItem, deleteItem };

