import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorBanner } from '@/components/ui/error-banner';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/authService';
import { ApiError, logApiError } from '@/services/api-error';
import {
  buscarSenha,
  excluirSenha,
  listarSenhas,
  type Senha,
} from '@/services/senhaService';

export default function VaultScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);

  // Estado da visualização de senha
  const [selectedSenha, setSelectedSenha] = useState<Senha | null>(null);
  const [reauthVisible, setReauthVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailSenha, setDetailSenha] = useState<Senha | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [copied, setCopied] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await listarSenhas();
      setSenhas(data);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError) logApiError(apiError, 'vault-list');
      setError(apiError?.message ?? 'Não foi possível carregar suas credenciais.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleConfirmSignOut = () => {
    setIsConfirmingSignOut(false);
    void signOut();
  };

  const openReauth = (senha: Senha) => {
    setSelectedSenha(senha);
    setReauthPassword('');
    setReauthError(null);
    setReauthVisible(true);
  };

  const handleVerifyPassword = async () => {
    if (!selectedSenha) return;
    if (!user?.email) {
      setReauthError('Não foi possível identificar sua conta. Faça login novamente.');
      return;
    }
    if (reauthPassword.length === 0) {
      setReauthError('Informe sua senha de login.');
      return;
    }
    setIsVerifying(true);
    setReauthError(null);
    try {
      await authService.login({ email: user.email, password: reauthPassword });
      setIsLoadingDetail(true);
      setReauthVisible(false);
      setDetailVisible(true);
      try {
        const full = await buscarSenha(selectedSenha.id);
        setDetailSenha(full);
      } catch (err) {
        const apiError = err instanceof ApiError ? err : null;
        if (apiError) logApiError(apiError, 'vault-detail');
        setDetailSenha(selectedSenha);
        if (!selectedSenha.senha) {
          setDetailError(apiError?.message ?? 'Não foi possível carregar a senha.');
        }
      } finally {
        setIsLoadingDetail(false);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError) logApiError(apiError, 'reauth');
      setReauthError('Senha de login incorreta. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setDetailSenha(null);
    setDetailError(null);
    setCopied(false);
    setSelectedSenha(null);
  };

  const handleCopyPassword = async () => {
    if (!detailSenha?.senha) return;
    await Clipboard.setStringAsync(detailSenha.senha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!detailSenha) return;
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    try {
      await excluirSenha(detailSenha.id);
      setSenhas((current) => current.filter((s) => s.id !== detailSenha.id));
      closeDetail();
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError) logApiError(apiError, 'vault-delete');
      setDetailError(apiError?.message ?? 'Não foi possível excluir a credencial.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderItem = ({ item }: { item: Senha }) => (
    <Pressable
      onPress={() => openReauth(item)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}, usuário ${item.login}. Toque para ver a senha.`}
    >
      <View style={[styles.cardIcon, { backgroundColor: theme.primaryMuted }]}>
        <Text style={[styles.cardIconText, { color: theme.primary }]}>
          {item.titulo.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={[styles.cardLogin, { color: theme.textMuted }]} numberOfLines={1}>
          {item.login}
        </Text>
        {item.url ? (
          <Text style={[styles.cardUrl, { color: theme.primary }]} numberOfLines={1}>
            {item.url}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.cardChevron, { color: theme.textMuted }]}>›</Text>
    </Pressable>
  );

  const initial = (user?.name ?? 'U').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryMuted }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{initial}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.welcome, { color: theme.text }]}>Olá, {user?.name ?? 'usuário'}</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {senhas.length > 0
                  ? `${senhas.length} credencial${senhas.length > 1 ? 'is' : ''} protegida${senhas.length > 1 ? 's' : ''}`
                  : 'Seu cofre está protegido.'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setIsConfirmingSignOut(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            hitSlop={8}
            style={({ pressed }) => [styles.signOutLink, pressed && styles.pressed]}
          >
            <Text style={[styles.signOutText, { color: theme.danger }]}>Sair</Text>
          </Pressable>
        </View>

        {error ? <ErrorBanner title="Não foi possível carregar" message={error} /> : null}

        {isLoading && senhas.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando cofre...</Text>
          </View>
        ) : (
          <FlatList
            data={senhas}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderItem}
            contentContainerStyle={senhas.length === 0 ? styles.emptyContainer : styles.listContent}
            refreshing={isRefreshing}
            onRefresh={() => void load(true)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceMuted }]}>
                  <Text style={styles.emptyEmoji}>🗝️</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma credencial cadastrada</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                  Toque no botão abaixo para adicionar sua primeira senha.
                </Text>
                <Pressable
                  onPress={() => router.push('/add')}
                  style={({ pressed }) => [
                    styles.emptyCta,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar primeira credencial"
                >
                  <Text style={styles.emptyCtaText}>Adicionar credencial</Text>
                </Pressable>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          onPress={() => router.push('/add')}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova credencial"
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary },
            pressed && styles.fabPressed,
          ]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>

      {/* Modal de reautenticação */}
      {reauthVisible ? (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirmar identidade</Text>
            <Text style={[styles.modalMessage, { color: theme.textMuted }]}>
              {`Digite sua senha de login para visualizar a senha de "${selectedSenha?.titulo}".`}
            </Text>
            {reauthError ? <ErrorBanner title="Acesso negado" message={reauthError} /> : null}
            <TextInput
              value={reauthPassword}
              onChangeText={setReauthPassword}
              placeholder="Senha de login"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
              onSubmitEditing={() => void handleVerifyPassword()}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancelar"
                variant="ghost"
                size="md"
                onPress={() => {
                  setReauthVisible(false);
                  setSelectedSenha(null);
                }}
                disabled={isVerifying}
                fullWidth={false}
                style={styles.modalAction}
              />
              <Button
                label="Verificar"
                size="md"
                loading={isVerifying}
                loadingLabel="Verificando..."
                onPress={() => void handleVerifyPassword()}
                fullWidth={false}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      ) : null}

      {/* Modal de detalhe da credencial */}
      {detailVisible ? (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {detailSenha?.titulo ?? selectedSenha?.titulo}
            </Text>

            {detailError ? <ErrorBanner title="Não foi possível carregar" message={detailError} /> : null}

            {isLoadingDetail ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Usuário</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {detailSenha?.login ?? selectedSenha?.login}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Senha</Text>
                  <View style={styles.passwordRow}>
                    <Text style={[styles.detailValue, styles.passwordValue, { color: theme.text }]}>
                      {detailSenha?.senha ?? '••••••••'}
                    </Text>
                    <Pressable
                      onPress={handleCopyPassword}
                      accessibilityRole="button"
                      accessibilityLabel="Copiar senha"
                      style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
                    >
                      <Text style={[styles.copyText, { color: theme.primary }]}>
                        {copied ? 'Copiado!' : 'Copiar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {detailSenha?.url ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>URL</Text>
                    <Text style={[styles.detailValue, { color: theme.primary }]} numberOfLines={1}>
                      {detailSenha.url}
                    </Text>
                  </View>
                ) : null}

                {detailSenha?.observacoes ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Observações</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{detailSenha.observacoes}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                label="Excluir"
                variant="danger"
                size="md"
                loading={isDeleting}
                loadingLabel="Excluindo..."
                onPress={() => setIsConfirmingDelete(true)}
                disabled={isLoadingDetail || isDeleting}
                fullWidth={false}
                style={styles.modalAction}
              />
              <Button
                label="Fechar"
                variant="secondary"
                size="md"
                onPress={closeDetail}
                disabled={isDeleting}
                fullWidth={false}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      ) : null}

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

      <ConfirmDialog
        visible={isConfirmingDelete}
        title="Excluir credencial"
        message={`Tem certeza que deseja excluir "${detailSenha?.titulo ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  headerText: { flex: 1, gap: spacing.xxs },
  welcome: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13 },
  signOutLink: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  signOutText: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: 14 },
  listContent: { gap: spacing.md, paddingBottom: 96 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 18, fontWeight: '700' },
  cardBody: { flex: 1, gap: spacing.xxs },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardLogin: { fontSize: 13 },
  cardUrl: { fontSize: 12, marginTop: spacing.xxs },
  cardChevron: { fontSize: 22, fontWeight: '300' },
  emptyState: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  emptyCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabPressed: { transform: [{ scale: 0.92 }], opacity: 0.9 },
  fabIcon: { color: '#FFFFFF', fontSize: 30, fontWeight: '400', lineHeight: 32 },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalMessage: { fontSize: 14, lineHeight: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: MIN_TOUCH_TARGET,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalAction: { minWidth: 110 },
  detailBody: { gap: spacing.md },
  detailRow: { gap: spacing.xxs },
  detailLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, fontWeight: '500' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  passwordValue: { flex: 1, fontFamily: 'monospace' },
  copyButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  copyText: { fontSize: 14, fontWeight: '700' },
});
