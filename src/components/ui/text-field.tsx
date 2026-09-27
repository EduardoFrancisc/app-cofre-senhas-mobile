import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type TextFieldVariant = 'default' | 'password';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Mensagem de erro exibida abaixo do campo. Anula o estilo de foco. */
  error?: string;
  /** Dica exibida abaixo do campo quando não há erro. */
  hint?: string;
  variant?: TextFieldVariant;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  error,
  hint,
  variant = 'default',
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const isPassword = variant === 'password';
  const helperText = error ?? hint;
  const describedBy = `${inputProps.testID ?? label}-helper`;

  const handleFocus = (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: theme.textMuted }]} nativeID={`${label}-label`}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          borderStyles(theme, { isFocused, hasError: Boolean(error) }),
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          accessibilityHint={helperText}
          placeholderTextColor={theme.textPlaceholder}
          // Precisa vir depois de `...inputProps` para que a variante
          // "password" realmente controle a ocultação. Sem isto o botão
          // Mostrar/Ocultar não teria nenhum efeito visível.
          secureTextEntry={isPassword && !isRevealed}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: theme.text }]}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setIsRevealed((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={isRevealed ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={8}
            style={styles.revealButton}
          >
            <Text style={[styles.revealLabel, { color: theme.primary }]}>
              {isRevealed ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {helperText ? (
        <Text
          nativeID={describedBy}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={[styles.helper, { color: error ? theme.danger : theme.textMuted }]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    // 16px evita o zoom automático do Safari no iOS ao focar o campo.
    fontSize: 16,
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  revealButton: {
    minHeight: MIN_TOUCH_TARGET - 12,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  revealLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
});

function borderStyles(theme: ThemeColors, { isFocused, hasError }: { isFocused: boolean; hasError: boolean }) {
  if (hasError) {
    return { borderColor: theme.danger, backgroundColor: theme.surface };
  }
  if (isFocused) {
    return { borderColor: theme.primary, backgroundColor: theme.surface };
  }
  return { borderColor: theme.border, backgroundColor: theme.surface };
}
