import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { Button, Input, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import { CustomButton } from '../src/components/CustomButton';
import { CONFIG } from '../src/constants/config';
import { THEME } from '../src/constants/theme';
import {
  ensureUserProfile,
  formatSupabaseError,
  logSupabaseError,
  logUnexpectedError,
  supabase,
} from '../src/services/supabase';
import { useAppDispatch } from '../src/store';
import { setProfile, setSession } from '../src/store/slices/authSlice';
import { setDailyCalorieGoal } from '../src/store/slices/dietSlice';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Email không hợp lệ', 'Kiểm tra lại địa chỉ email rồi thử lại.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        Alert.alert('Đăng nhập thất bại', logSupabaseError('auth.signInWithPassword', error));
        return;
      }

      if (!data.session || !data.user) {
        console.error('[Supabase][auth.signInWithPassword] Authentication returned no session or user.', {
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user),
        });
        Alert.alert(
          'Đăng nhập chưa hoàn tất',
          'Supabase không trả về phiên đăng nhập. Kiểm tra cấu hình Auth và log [Supabase][auth.signInWithPassword].'
        );
        return;
      }

      dispatch(setSession(data.session));
      const { data: profile, error: profileError } = await ensureUserProfile(data.user);
      dispatch(setProfile(profile));
      dispatch(setDailyCalorieGoal(profile?.daily_calorie_goal ?? CONFIG.DEFAULT_DAILY_CALORIE_GOAL));

      if (profileError) {
        Alert.alert(
          'Đăng nhập được nhưng chưa tải được hồ sơ',
          `Phiên đăng nhập hợp lệ nhưng hồ sơ chưa thể đọc/tạo.\n\n${formatSupabaseError(profileError)}`,
          [{ text: 'Vào Dashboard', onPress: () => router.replace('/(tabs)') }]
        );
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Lỗi hệ thống', logUnexpectedError('auth.signInWithPassword', error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Quên mật khẩu', 'Nhập email để nhận liên kết đặt lại mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Email không hợp lệ', 'Kiểm tra lại địa chỉ email rồi thử lại.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        Alert.alert('Không thể gửi email', logSupabaseError('auth.resetPasswordForEmail', error));
        return;
      }
      Alert.alert('Đã gửi email', 'Kiểm tra hộp thư để đặt lại mật khẩu.');
    } catch (error) {
      Alert.alert('Lỗi hệ thống', logUnexpectedError('auth.resetPasswordForEmail', error));
    }
  };

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$5">
        <XStack justifyContent="space-between" alignItems="center">
          <Button
            circular
            width={40}
            height={40}
            backgroundColor="transparent"
            onPress={() => router.replace('/')}
          >
            <Text fontSize={24} color={THEME.colors.textMain}>‹</Text>
          </Button>
          <XStack alignItems="center" gap="$2">
            <View
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor={THEME.colors.primary}
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#FFFFFF" fontSize={17} fontWeight="800">⌁</Text>
            </View>
            <Text fontSize={18} fontWeight="800" color={THEME.colors.textMain}>Sign In</Text>
          </XStack>
          <Button
            circular
            width={40}
            height={40}
            backgroundColor={THEME.colors.primaryDark}
            onPress={() => router.push('/register')}
          >
            <Text color="#FFFFFF" fontSize={16}>♙</Text>
          </Button>
        </XStack>

        <YStack alignItems="center" gap="$3" paddingTop="$2">
          <View
            width={64}
            height={64}
            borderRadius={20}
            backgroundColor={THEME.colors.primary}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#FFFFFF" fontSize={34}>♨</Text>
          </View>
          <View
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={THEME.radius.full}
            backgroundColor={THEME.colors.primaryLight}
          >
            <Text color={THEME.colors.primaryDark} fontSize={12} fontWeight="700">
              ● Vital Nutrition Pro
            </Text>
          </View>
          <Text fontSize={26} fontWeight="800" color={THEME.colors.textMain} textAlign="center">
            Chào mừng trở lại!
          </Text>
          <Text fontSize={14} color={THEME.colors.textMuted} textAlign="center" lineHeight={21}>
            Đăng nhập để tiếp tục theo dõi lộ trình dinh dưỡng và mục tiêu của bạn.
          </Text>
        </YStack>

        <YStack
          backgroundColor={THEME.colors.card}
          padding="$4"
          borderRadius={28}
          gap="$3"
          borderWidth={1}
          borderColor={THEME.colors.borderLight}
        >
          <YStack gap="$2">
            <Text fontSize={13} fontWeight="700" color={THEME.colors.textMain}>Email tài khoản</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              backgroundColor={THEME.colors.background}
              borderWidth={0}
              borderRadius={THEME.radius.full}
              height={48}
              paddingHorizontal="$4"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize={13} fontWeight="700" color={THEME.colors.textMain}>Mật khẩu</Text>
            <XStack
              alignItems="center"
              backgroundColor={THEME.colors.background}
              borderRadius={THEME.radius.full}
              paddingRight="$2"
            >
              <Input
                flex={1}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                autoComplete="password"
                backgroundColor="transparent"
                borderWidth={0}
                height={48}
                paddingHorizontal="$4"
              />
              <Button
                backgroundColor="transparent"
                borderWidth={0}
                onPress={() => setShowPassword((visible) => !visible)}
              >
                <Text fontSize={13} color={THEME.colors.textMuted}>
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </Button>
            </XStack>
          </YStack>

          <XStack justifyContent="flex-end">
            <Button backgroundColor="transparent" borderWidth={0} paddingHorizontal={0} onPress={handleForgotPassword}>
              <Text fontSize={12} fontWeight="700" color={THEME.colors.primaryDark}>
                Quên mật khẩu?
              </Text>
            </Button>
          </XStack>

          <CustomButton
            title="Đăng nhập ngay  →"
            onPress={handleLogin}
            loading={loading}
            size="large"
          />
        </YStack>

        <XStack alignItems="center" gap="$3">
          <View flex={1} height={1} backgroundColor={THEME.colors.border} />
          <Text fontSize={11} color={THEME.colors.textMuted}>HOẶC TIẾP TỤC VỚI</Text>
          <View flex={1} height={1} backgroundColor={THEME.colors.border} />
        </XStack>

        <XStack justifyContent="center" gap="$2">
          <Text fontSize={14} color={THEME.colors.textMuted}>Chưa có tài khoản?</Text>
          <Button backgroundColor="transparent" borderWidth={0} paddingHorizontal={0} onPress={() => router.push('/register')}>
            <Text fontSize={14} fontWeight="700" color={THEME.colors.primaryDark}>Đăng ký ngay</Text>
          </Button>
        </XStack>

        <View
          alignSelf="center"
          paddingHorizontal="$3"
          paddingVertical="$2"
          backgroundColor={THEME.colors.primaryLight}
          borderRadius={THEME.radius.full}
        >
          <Text fontSize={11} color={THEME.colors.textMuted}>● Bảo mật bởi Supabase Auth</Text>
        </View>
      </YStack>
    </ScrollView>
  );
}
