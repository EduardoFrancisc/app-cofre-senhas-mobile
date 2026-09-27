import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface AuthScreenProps {
  children: ReactNode;
  /** Torna a área rolável. Use em formulários longos (ex.: cadastro). */
  scrollable?: boolean;
  keyboardVerticalOffset?: number;
}

/**
 * Container compartilhado pelas telas de autenticação.
 *
 * Centraliza o tratamento de teclado, safe area e largura máxima — os três
 * pontos que, duplicados por tela, divergem e geram o "sobe um pouco" no iOS
 * e o conteúdo cortado atrás da barra de navegação no Android.
 */
export function AuthScreen({ children, scrollable = false, keyboardVerticalOffset = 0 }: AuthScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
});
