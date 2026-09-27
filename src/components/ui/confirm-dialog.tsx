import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

import { Button } from './button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estiliza a ação de confirmação em vermelho (ações destrutivas). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmação cross-platform.
 *
 * Existe porque `Alert.alert` só funciona em iOS e Android — no
 * react-native-web ele é um no-op silencioso (`static alert() {}`), o que
 * fazia o botão de sair parecer quebrado no navegador. Todo o app passa
 * por aqui para não repetir o problema.
 *
 * Fica montado só enquanto visível, então o foco volta para o botão que abriu
 * o diálogo ao fechar.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Necessário para o botão físico "voltar" do Android fechar o diálogo.
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      {/* Backdrop: tocar fora cancela. Fica fora da árvore de acessibilidade
          para não poluir a leitura com um "botão Fechar" de tela cheia. */}
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
        onPress={onCancel}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {/* Impede que o toque dentro do cartão propague para o backdrop. */}
        <Pressable
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
              {title}
            </Text>
            {message ? <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button
              testID="confirm-dialog-cancel"
              label={cancelLabel}
              variant="secondary"
              size="md"
              onPress={onCancel}
              style={styles.action}
            />
            <Button
              testID="confirm-dialog-confirm"
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              size="md"
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  action: {
    minWidth: 112,
    minHeight: MIN_TOUCH_TARGET - 8,
  },
});
