import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { AuthScreen } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/useAuth';
import { useAuthForm } from '@/hooks/use-auth-form';
import type { LoginCredentials } from '@/types/auth.types';
import { validateLoginForm } from '@/utils/validation';

export default function LoginScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  // Preenchido pelo cadastro quando o auto-login não é possível.
  const { email: emailFromRegister } = useLocalSearchParams<{ email?: string | string[] }>();

  const [email, setEmail] = useState(() => (typeof emailFromRegister === 'string' ? emailFromRegister : ''));
  const [password, setPassword] = useState('');

  const { fieldErrors, serverError, isSubmitting, handleSubmit, handleFieldChange } = useAuthForm<
    LoginCredentials,
    'email' | 'password'
  >({
    validate: validateLoginForm,
    context: 'login-form',
    fallbackErrorTitle: 'Não foi possível entrar',
    mapServerFieldErrors: (serverErrors) => {
      const mapped: Partial<Record<'email' | 'password', string>> = {};
      for (const [key, message] of Object.entries(serverErrors)) {
        // O backend chama a senha de `senha`.
        if (key === 'senha' || key === 'password') mapped.password = message;
        if (key === 'email') mapped.email = message;
      }
      return mapped;
    },
  });

  // <Link asChild> renderiza via <Slot>, que não aceita arrays de estilo.
  const linkStyle = StyleSheet.flatten([styles.footerLink, { color: theme.primary }]);

  return (
    <AuthScreen>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={[styles.title, { color: theme.text }]}>Cofre de Senhas</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Acesse sua conta</Text>
      </View>

      <View style={styles.form}>
        <ErrorBanner
          testID="login-error-banner"
          title={serverError?.title ?? ''}
          message={serverError?.message}
        />

        <TextField
          testID="login-email-input"
          label="E-mail"
          value={email}
          onChangeText={handleFieldChange('email', setEmail)}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          error={fieldErrors.email}
        />

        <TextField
          testID="login-password-input"
          label="Senha"
          variant="password"
          value={password}
          onChangeText={handleFieldChange('password', setPassword)}
          placeholder="Sua senha"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit({ email, password }, signIn)}
          error={fieldErrors.password}
        />

        <Button
          testID="login-submit-button"
          label="Entrar"
          loading={isSubmitting}
          loadingLabel="Entrando..."
          onPress={() => void handleSubmit({ email, password }, signIn)}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Ainda não tem conta? </Text>
        {/*
          `asChild` faz o Link renderizar este Text através de um <Slot>, que
          não aceita `style` em array — por isso o StyleSheet.flatten.
        */}
        <Link href="/register" asChild>
          <Text style={linkStyle}>Cadastre-se</Text>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
