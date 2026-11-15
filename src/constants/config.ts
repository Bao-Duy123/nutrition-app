/**
 * CONFIG & SUPABASE CREDENTIALS
 */

export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com/v1',
  DEFAULT_DAILY_CALORIE_GOAL: 2000,
  DEFAULT_MACRO_RATIOS: {
    carbsPercentage: 0.5, // 50%
    proteinPercentage: 0.25, // 25%
    fatPercentage: 0.25, // 25%
  },
};
