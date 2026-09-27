import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/useAuth';

export default function VaultScreen() {
  const theme = useAppTheme();
  const { user, signOut } = useAuth();
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);

  const handleConfirmSignOut = () => {
    setIsConfirmingSignOut(false);
    // `Stack.Protected` no layout raiz reage ao token nulo e leva para o login.
    void signOut();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.welcome}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>Olá, {user?.name ?? 'usuário'}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Seu cofre está protegido.</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗝️</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma senha cadastrada</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Suas entradas aparecerão aqui. A criação de entradas ainda não está disponível nesta versão.
          </Text>
        </View>

        <Button
          testID="vault-sign-out-button"
          label="Sair da conta"
          variant="secondary"
          onPress={() => setIsConfirmingSignOut(true)}
          style={[styles.signOut, { borderColor: theme.danger }]}
          leftAccessory={<Text style={[styles.signOutIcon, { color: theme.danger }]}>⏻</Text>}
        />
      </View>

      <ConfirmDialog
        visible={isConfirmingSignOut}
        title="Sair da conta"
        message="Você precisará entrar novamente para acessar seu cofre."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirmSignOut}
        onCancel={() => setIsConfirmingSignOut(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  welcome: {
    gap: spacing.xs,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  signOut: {
    borderRadius: radius.md,
  },
  signOutIcon: {
    fontSize: 15,
  },
});
