import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store não tem suporte na Web.
// Esta abstração usa SecureStore em native e localStorage em web
// (apenas para desenvolvimento — em produção este app não roda na web).

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const storage = { getItem, setItem, deleteItem };
