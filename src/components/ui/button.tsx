import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra spinner e bloqueia novos disparos. */
  loading?: boolean;
  /** Texto exibido enquanto `loading` é verdadeiro. */
  loadingLabel?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  leftAccessory?: ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  loadingLabel,
  fullWidth = true,
  disabled,
  style,
  leftAccessory,
  ...pressableProps
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles(size),
        variantStyles(variant, theme),
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantPressedStyles(variant, theme),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator color={labelColors(variant, theme)} size="small" />
          {loadingLabel ? <Text style={[styles.label, { color: labelColors(variant, theme) }]}>{loadingLabel}</Text> : null}
        </>
      ) : (
        <View style={styles.content}>
          {leftAccessory}
          <Text style={[styles.label, { color: labelColors(variant, theme) }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Estilos                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.55,
  },
});

function sizeStyles(size: ButtonSize) {
  return size === 'md' ? { minHeight: MIN_TOUCH_TARGET - 8 } : { minHeight: MIN_TOUCH_TARGET };
}

function variantStyles(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: theme.surface, borderColor: theme.border };
    case 'ghost':
      return { backgroundColor: 'transparent', borderColor: 'transparent' };
    case 'danger':
      return { backgroundColor: theme.danger, borderColor: theme.danger };
    case 'primary':
    default:
      return { backgroundColor: theme.primary, borderColor: theme.primary };
  }
}

function variantPressedStyles(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: theme.surfaceMuted, borderColor: theme.borderStrong };
    case 'ghost':
      return { backgroundColor: theme.surfaceMuted };
    case 'danger':
      return { backgroundColor: theme.dangerPressed, borderColor: theme.dangerPressed };
    case 'primary':
    default:
      return { backgroundColor: theme.primaryPressed, borderColor: theme.primaryPressed };
  }
}

function labelColors(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'secondary':
      return theme.text;
    case 'danger':
      return theme.dangerText;
    case 'primary':
    default:
      return theme.primaryText;
  }
}
