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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const SIZE_CONFIG: Record<ButtonSize, { minHeight: number; paddingH: number; font: number; gap: number }> = {
  sm: { minHeight: 36, paddingH: spacing.md, font: 14, gap: spacing.xs },
  md: { minHeight: MIN_TOUCH_TARGET - 8, paddingH: spacing.lg, font: 15, gap: spacing.sm },
  lg: { minHeight: MIN_TOUCH_TARGET, paddingH: spacing.xl, font: 16, gap: spacing.sm },
};

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
  rightAccessory,
  leftIcon,
  rightIcon,
  ...pressableProps
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled === true || loading;
  const cfg = SIZE_CONFIG[size];
  const left = leftAccessory ?? leftIcon;
  const right = rightAccessory ?? rightIcon;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      android_ripple={
        isDisabled
          ? undefined
          : { color: rippleColor(variant, theme), borderless: false, foreground: true }
      }
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: cfg.minHeight,
          paddingHorizontal: cfg.paddingH,
          gap: cfg.gap,
        },
        variantStyles(variant, theme),
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator color={labelColors(variant, theme)} size="small" />
          {loadingLabel ? (
            <Text style={[styles.label, { fontSize: cfg.font, color: labelColors(variant, theme) }]}>
              {loadingLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.content}>
          {left}
          <Text
            style={[styles.label, { fontSize: cfg.font, color: labelColors(variant, theme) }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {right}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

function variantStyles(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: theme.surface, borderColor: theme.border };
    case 'ghost':
      return { backgroundColor: 'transparent', borderColor: 'transparent' };
    case 'outline':
      return { backgroundColor: 'transparent', borderColor: theme.primary };
    case 'danger':
      return { backgroundColor: theme.danger, borderColor: theme.danger };
    case 'primary':
    default:
      return { backgroundColor: theme.primary, borderColor: theme.primary };
  }
}

function labelColors(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'secondary':
      return theme.text;
    case 'ghost':
      return theme.primary;
    case 'outline':
      return theme.primary;
    case 'danger':
      return theme.dangerText;
    case 'primary':
    default:
      return theme.primaryText;
  }
}

function rippleColor(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'danger':
      return 'rgba(255,255,255,0.25)';
    case 'primary':
      return 'rgba(255,255,255,0.2)';
    default:
      return theme.surfaceMuted;
  }
}
