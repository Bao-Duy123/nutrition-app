import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Text, Spinner } from 'tamagui';
import { useAuth } from '../src/hooks/useAuth';
import { THEME } from '../src/constants/theme';
import { isUserOnboarded } from '../src/utils/validation';

export default function InitialScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, profile, session } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (isUserOnboarded(profile, session?.user)) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, profile, router]);

  return (
    <YStack
      flex={1}
      backgroundColor={THEME.colors.background}
      alignItems="center"
      justifyContent="center"
      gap="$4"
    >
      <Text fontSize={48}>🥗</Text>
      <Text fontSize={24} fontWeight="800" color={THEME.colors.primaryDark}>
        Nutrition 
      </Text>
      <Spinner size="large" color={THEME.colors.primary} />
      <Text fontSize={14} color={THEME.colors.textMuted}>
        Đang khởi động hệ thống...
      </Text>
    </YStack>
  );
}
