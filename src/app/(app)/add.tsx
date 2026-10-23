import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ApiError, logApiError } from '@/services/api-error';
import { criarSenha } from '@/services/senhaService';

interface FieldErrors {
  title?: string;
  login?: string;
  password?: string;
}

export default function AddCredentialScreen() {
  const theme = useAppTheme();

  const [title, setTitle] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<{ title: string; message?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (current[field] === undefined) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (title.trim().length === 0) errors.title = 'Informe o nome do serviço.';
    if (login.trim().length === 0) errors.login = 'Informe o usuário ou e-mail.';
    if (password.length === 0) errors.password = 'Informe a senha.';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    setServerError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await criarSenha({ titulo: title.trim(), login: login.trim(), senha: password });
      Alert.alert('Sucesso', 'Credencial adicionada com sucesso.');
      router.back();
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError) logApiError(apiError, 'add-credential');
      setServerError({
        title: apiError ? 'Não foi possível salvar' : 'Algo deu errado',
        message: apiError?.message ?? 'Tente novamente em instantes.',
      });

      if (apiError?.fieldErrors) {
        const mapped: FieldErrors = {};
        for (const [key, message] of Object.entries(apiError.fieldErrors)) {
          if (key === 'titulo' || key === 'title') mapped.title = message;
          if (key === 'login' || key === 'usuario' || key === 'email') mapped.login = message;
          if (key === 'senha' || key === 'password') mapped.password = message;
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors((current) => ({ ...current, ...mapped }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primaryMuted }]}>
              <Text style={[styles.headerIconText, { color: theme.primary }]}>＋</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>Nova credencial</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Adicione um serviço ao seu cofre.
              </Text>
            </View>
          </View>

          <ErrorBanner
            testID="add-error-banner"
            title={serverError?.title ?? ''}
            message={serverError?.message}
          />

          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextField
              testID="add-title-input"
              label="Nome do serviço"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                clearFieldError('title');
              }}
              placeholder="Ex.: Netflix, Google"
              autoCapitalize="words"
              returnKeyType="next"
              error={fieldErrors.title}
            />

            <TextField
              testID="add-login-input"
              label="Usuário / E-mail"
              value={login}
              onChangeText={(value) => {
                setLogin(value);
                clearFieldError('login');
              }}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              error={fieldErrors.login}
            />

            <TextField
              testID="add-password-input"
              label="Senha"
              variant="password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              placeholder="Senha do serviço"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => void handleSubmit()}
              error={fieldErrors.password}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label="Cancelar"
              variant="ghost"
              size="md"
              onPress={() => router.back()}
              disabled={isSubmitting}
              fullWidth={false}
              style={styles.secondaryAction}
            />
            <Button
              testID="add-submit-button"
              label="Salvar"
              size="md"
              loading={isSubmitting}
              loadingLabel="Salvando..."
              onPress={() => void handleSubmit()}
              style={styles.primaryAction}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 24, fontWeight: '700' },
  headerText: { flex: 1, gap: spacing.xxs },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  formCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  secondaryAction: { minWidth: 110 },
  primaryAction: { minWidth: 140 },
});
