import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

export const config = createTamagui({
  ...defaultConfig,
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
    allowedStyleValues: false,
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#F9FAFB',
      color: '#111827',
      primary: '#10B981',
      primaryHover: '#059669',
      card: '#FFFFFF',
      border: '#E5E7EB',
      muted: '#6B7280',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#111827',
      color: '#F9FAFB',
      primary: '#10B981',
      primaryHover: '#059669',
      card: '#1F2937',
      border: '#374151',
      muted: '#9CA3AF',
    },
  },
});

export type Conf = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
