import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import { AuthScreen } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthForm } from '@/hooks/use-auth-form';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterPayload } from '@/types/auth.types';
import { normalizeEmail, validateRegisterForm, type FieldErrors } from '@/utils/validation';

/** Campos do formulário, incluindo a confirmação que não vai para a API. */
type RegisterFormValues = RegisterPayload & { confirmPassword: string };

function validateRegisterFormWithConfirmation(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = validateRegisterForm(values);

  if (values.confirmPassword.length === 0) {
    errors.confirmPassword = 'Confirme sua senha.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'As senhas informadas não coincidem.';
  }

  return errors;
}

/**
 * O backend nomeia os campos em português (`UsuarioRequestDTO`).
 * Mapeamos para os nomes do formulário, que são em inglês.
 */
const SERVER_FIELD_ALIASES: Record<string, keyof RegisterFormValues> = {
  nome: 'name',
  name: 'name',
  email: 'email',
  senha: 'password',
  password: 'password',
  confirmPassword: 'confirmPassword',
};

export default function RegisterScreen() {
  const theme = useAppTheme();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { fieldErrors, serverError, isSubmitting, handleSubmit, handleFieldChange } = useAuthForm<
    RegisterFormValues,
    keyof RegisterFormValues
  >({
    validate: validateRegisterFormWithConfirmation,
    context: 'register-form',
    fallbackErrorTitle: 'Não foi possível criar a conta',
    mapServerFieldErrors: (serverErrors) => {
      const mapped: Partial<Record<keyof RegisterFormValues, string>> = {};
      for (const [key, message] of Object.entries(serverErrors)) {
        const field = SERVER_FIELD_ALIASES[key];
        if (field) mapped[field] = message;
      }
      return mapped;
    },
  });

  const submit = async ({ confirmPassword: _confirm, ...values }: RegisterFormValues) => {
    const { autoSignedIn } = await signUp(values);

    if (autoSignedIn) {
      // O guard de `Stack.Protected` leva para o cofre sozinho.
      return;
    }

    router.replace({ pathname: '/login', params: { email: normalizeEmail(values.email) } });
  };

  // <Link asChild> renderiza via <Slot>, que não aceita arrays de estilo.
  const linkStyle = StyleSheet.flatten([styles.footerLink, { color: theme.primary }]);

  return (
    <AuthScreen scrollable>
      <View style={styles.header}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={[styles.title, { color: theme.text }]}>Criar conta</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Comece a proteger suas senhas</Text>
      </View>

      <View style={styles.form}>
        <ErrorBanner
          testID="register-error-banner"
          title={serverError?.title ?? ''}
          message={serverError?.message}
        />

        <TextField
          testID="register-name-input"
          label="Nome completo"
          value={name}
          onChangeText={handleFieldChange('name', setName)}
          placeholder="Como podemos te chamar"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          error={fieldErrors.name}
        />

        <TextField
          testID="register-email-input"
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
          testID="register-password-input"
          label="Senha"
          variant="password"
          value={password}
          onChangeText={handleFieldChange('password', setPassword)}
          placeholder="Mínimo 8 caracteres"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => void handleSubmit({ name, email, password, confirmPassword }, submit)}
          error={fieldErrors.password}
        />

        <PasswordStrengthMeter password={password} />

        <TextField
          testID="register-confirm-input"
          label="Confirmar senha"
          variant="password"
          value={confirmPassword}
          onChangeText={handleFieldChange('confirmPassword', setConfirmPassword)}
          placeholder="Repita a senha"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit({ name, email, password, confirmPassword }, submit)}
          error={fieldErrors.confirmPassword}
        />

        <Button
          testID="register-submit-button"
          label="Criar conta"
          variant="primary"
          loading={isSubmitting}
          loadingLabel="Criando conta..."
          onPress={() => void handleSubmit({ name, email, password, confirmPassword }, submit)}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Já tem uma conta? </Text>
        <Link href="/login" asChild>
          <Text style={linkStyle}>Entrar</Text>
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
