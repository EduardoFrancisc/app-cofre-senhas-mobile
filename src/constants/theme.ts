import { Platform } from 'react-native';

/**
 * Espaçamentos em múltiplos de 4 (grid de 4pt).
 * Use `spacing.xs` para ajustes de 1-2px e `spacing.xs`+ para blocos de layout.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Raios de cantos. `pill` é para chips, avatares e botões de ícone.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Alturas mínimas de alvo tocável.
 * Apple recomenda 44pt, Material 48dp. Usamos 48 como denominador comum.
 */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_TARGET = 48;

export interface ThemeColors {
  scheme: 'light' | 'dark';

  /** Fundo da tela. */
  background: string;
  /** Fundo de cards, inputs e superfícies elevadas. */
  surface: string;
  /** Fundo sutil para linhas, chips e estados hover/pressed. */
  surfaceMuted: string;

  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textInverted: string;
  textPlaceholder: string;

  primary: string;
  primaryPressed: string;
  primaryMuted: string;
  primaryText: string;

  danger: string;
  dangerPressed: string;
  dangerMuted: string;
  dangerText: string;

  success: string;
  successMuted: string;

  /** Botão desabilitado. */
  disabled: string;
  /** Fundo de overlays e modais (ex.: diálogo de confirmação). */
  overlay: string;
}

const light: ThemeColors = {
  scheme: 'light',

  background: '#F5F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1F9',

  border: '#D5DDEC',
  borderStrong: '#AEBBD1',

  text: '#0B1220',
  textMuted: '#59688A',
  textInverted: '#FFFFFF',
  textPlaceholder: '#8D9AB4',

  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primaryMuted: '#DCE8FE',
  primaryText: '#FFFFFF',

  danger: '#D92D20',
  dangerPressed: '#B42318',
  dangerMuted: '#FDE4E2',
  dangerText: '#FFFFFF',

  success: '#067647',
  successMuted: '#D3F8E4',

  disabled: '#B4BFD4',
  overlay: 'rgba(11, 18, 32, 0.45)',
};

const dark: ThemeColors = {
  scheme: 'dark',

  background: '#0B1220',
  surface: '#131D31',
  surfaceMuted: '#1C2840',

  border: '#2A3853',
  borderStrong: '#3B4C6B',

  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textInverted: '#0B1220',
  textPlaceholder: '#6B7C99',

  primary: '#3B82F6',
  primaryPressed: '#2563EB',
  primaryMuted: '#1E3A6B',
  primaryText: '#FFFFFF',

  danger: '#EF4444',
  dangerPressed: '#B91C1C',
  dangerMuted: '#45191C',
  dangerText: '#FFFFFF',

  success: '#10B981',
  successMuted: '#0D3B2E',

  disabled: '#2A3853',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const themes: Record<'light' | 'dark', ThemeColors> = { light, dark };

/**
 * Pilha de fontes do sistema. Usamos a fonte nativa para evitar
 * o custo de carregamento de fontes customizadas — o app não
 * precisa de tipografia de marca.
 */
export const fontFamily = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    sansMedium: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    sansMedium: 'System',
    mono: 'monospace',
  },
}) as { sans: string; sansMedium?: string; mono: string };

/** Largura máxima para o conteúdo em tablets e web. */
export const MAX_CONTENT_WIDTH = 480;
