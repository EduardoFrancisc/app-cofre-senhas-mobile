import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getPasswordStrength, type PasswordStrength } from '@/utils/validation';

const SEGMENT_COUNT = 4;

const SEGMENT_COLORS: Record<Exclude<PasswordStrength, 'empty'>, keyof ThemeColors> = {
  weak: 'danger',
  fair: 'dangerPressed',
  good: 'primary',
  strong: 'success',
};

/**
 * Medidor de força da senha.
 *
 * Puramente informativo: o NIST SP 800-63B recomenda comprimento e
 * aleatoriedade acima de regras de composição, então a senha é aceita com
 * 8+ caracteres e o medidor apenas orienta.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const theme = useAppTheme();
  const { level, score, label } = getPasswordStrength(password);

  if (level === 'empty') return null;

  const activeColor = theme[SEGMENT_COLORS[level]];
  const helperText = score < 2 ? 'Use mais caracteres para aumentar a segurança.' : 'Boa senha.';

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: SEGMENT_COUNT, now: score }}
      accessibilityLabel={`Força da senha: ${label}`}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Força da senha</Text>
        <Text style={[styles.value, { color: activeColor }]}>{label}</Text>
      </View>

      <View style={styles.track}>
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              { backgroundColor: index < score ? activeColor : theme.surfaceMuted },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.helper, { color: theme.textMuted }]}>{helperText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
  },
  helper: {
    fontSize: 12,
  },
});
