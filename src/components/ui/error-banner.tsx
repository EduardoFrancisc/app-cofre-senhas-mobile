import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ErrorBannerProps {
  title: string;
  message?: string;
  testID?: string;
}

/**
 * Mostra falhas que não são de validação (rede, servidor, credenciais).
 *
 * Diálogos nativos são bloqueantes e somem sozinhos: o usuário não consegue
 * conferir a mensagem enquanto preenche o formulário. Um banner inline
 * permanece visível e é lido por leitores de tela via `accessibilityLiveRegion`.
 */
export function ErrorBanner({ title, message, testID }: ErrorBannerProps) {
  const theme = useAppTheme();

  if (!title) return null;

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: theme.dangerMuted, borderColor: theme.danger }]}
    >
      <Text style={[styles.title, { color: theme.danger }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
