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
      <View style={styles.row}>
        <Text style={[styles.icon, { color: theme.danger, borderColor: theme.danger }]}>!</Text>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.danger }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    textAlign: 'center',
    lineHeight: 19,
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    gap: spacing.xxs,
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
