import { useColorScheme } from 'react-native';

import { themes, type ThemeColors } from '@/constants/theme';

export type { ThemeColors };

/**
 * Resolve as cores do esquema ativo.
 *
 * `userInterfaceStyle: "automatic"` no `app.json` faz o app herdar o tema do
 * sistema. O valor centralizado aqui evita que cada tela repita os pares
 * de cores e fique ilegível no tema errado.
 */
export function useAppTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'light' ? themes.light : themes.dark;
}
