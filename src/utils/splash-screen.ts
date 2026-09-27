import { Platform } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

/**
 * Wrapper fino sobre `expo-splash-screen`.
 *
 * Isolar o módulo aqui mantém o `preventAutoHideAsync()` no topo do arquivo —
 * que precisa rodar antes do primeiro render — separado do resto da navegação,
 * e centraliza o `catch` de "já foi escondido".
 */
export const SplashScreen = {
  preventAutoHideAsync(): void {
    void ExpoSplashScreen.preventAutoHideAsync().catch(() => {
      // Já escondido ou indisponível na web. Sem ação necessária.
    });
  },

  hideAsync(): Promise<void> {
    if (Platform.OS === 'web') {
      return Promise.resolve();
    }
    return ExpoSplashScreen.hideAsync().catch(() => {
      // Idempotente: hideAsync após um hide anterior não deve gerar erro.
    });
  },
};
