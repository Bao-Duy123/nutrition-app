import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Button, Input, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
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
import { showAlert } from '../src/utils/showAlert';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('saved-login-email')
      .then((savedEmail) => {
        if (active && savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      })
      .catch((error) => logUnexpectedError('auth.loadSavedEmail', error));
    return () => {
      active = false;
    };
  }, []);

  const completeLogin = async (session: Session) => {
    dispatch(setSession(session));
    try {
      if (rememberEmail) {
        await AsyncStorage.setItem('saved-login-email', email.trim().toLowerCase());
      } else {
        await AsyncStorage.removeItem('saved-login-email');
      }
    } catch (error) {
      logUnexpectedError('auth.saveRememberedEmail', error);
    }

    const { data: profile, error: profileError } = await ensureUserProfile(session.user);
    dispatch(setProfile(profile));
    dispatch(setDailyCalorieGoal(profile?.daily_calorie_goal ?? CONFIG.DEFAULT_DAILY_CALORIE_GOAL));

    if (profileError) {
      showAlert(
        'Đăng nhập được nhưng chưa tải được hồ sơ',
        `Phiên đăng nhập hợp lệ nhưng hồ sơ chưa thể đọc/tạo.\n\n${formatSupabaseError(profileError)}`,
        [{ text: 'Vào Dashboard', onPress: () => router.replace('/(tabs)') }]
      );
      return;
    }

    router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    if (loading || googleLoading) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showAlert('Email không hợp lệ', 'Kiểm tra lại địa chỉ email rồi thử lại.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        showAlert('Đăng nhập thất bại', logSupabaseError('auth.signInWithPassword', error));
        return;
      }

      if (!data.session || !data.user) {
        console.error('[Supabase][auth.signInWithPassword] Authentication returned no session or user.', {
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user),
        });
        showAlert(
          'Đăng nhập chưa hoàn tất',
          'Supabase không trả về phiên đăng nhập. Kiểm tra cấu hình Auth và log [Supabase][auth.signInWithPassword].'
        );
        return;
      }

      await completeLogin(data.session);
    } catch (error) {
      showAlert('Lỗi hệ thống', logUnexpectedError('auth.signInWithPassword', error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    try {
      setGoogleLoading(true);
      const redirectTo = Platform.OS === 'web'
        ? window.location.origin
        : makeRedirectUri({ scheme: 'nutritionapp', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) {
        showAlert('Không thể đăng nhập Google', logSupabaseError('auth.googleOAuth.start', error));
        return;
      }
      if (!data.url) {
        showAlert('Không thể đăng nhập Google', 'Supabase không trả về liên kết OAuth.');
        return;
      }

      if (Platform.OS === 'web') {
        window.location.assign(data.url);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;

      const callbackUrl = new URL(result.url);
      const callbackError =
        callbackUrl.searchParams.get('error_description') ?? callbackUrl.searchParams.get('error');
      if (callbackError) {
        showAlert(
          'Đăng nhập Google thất bại',
          logSupabaseError('auth.googleOAuth.callback', { message: callbackError })
        );
        return;
      }

      const code = callbackUrl.searchParams.get('code');
      if (!code) {
        const oauthError = { message: 'OAuth callback did not contain an authorization code.' };
        console.error('[Supabase][auth.googleOAuth.callback]', oauthError);
        showAlert(
          'Đăng nhập Google chưa hoàn tất',
          `${formatSupabaseError(oauthError)}\n\nKiểm tra Redirect URLs trong Supabase Auth.`
        );
        return;
      }

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        showAlert(
          'Không thể tạo phiên đăng nhập',
          logSupabaseError('auth.googleOAuth.exchangeCodeForSession', exchangeError)
        );
        return;
      }
      if (!sessionData.session) {
        showAlert('Đăng nhập Google chưa hoàn tất', 'Supabase không trả về phiên đăng nhập.');
        return;
      }

      await completeLogin(sessionData.session);
    } catch (error) {
      showAlert('Lỗi đăng nhập Google', logUnexpectedError('auth.googleOAuth', error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      showAlert('Quên mật khẩu', 'Nhập email để nhận liên kết đặt lại mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showAlert('Email không hợp lệ', 'Kiểm tra lại địa chỉ email rồi thử lại.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        showAlert('Không thể gửi email', logSupabaseError('auth.resetPasswordForEmail', error));
        return;
      }
      showAlert('Đã gửi email', 'Kiểm tra hộp thư để đặt lại mật khẩu.');
    } catch (error) {
      showAlert('Lỗi hệ thống', logUnexpectedError('auth.resetPasswordForEmail', error));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.background }} edges={['top', 'left', 'right']}>
      <ScrollView
        flex={1}
        backgroundColor={THEME.colors.background}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack width="100%" maxWidth={440} alignSelf="center" gap="$3">
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

        <YStack alignItems="center" gap="$2" paddingTop="$1">
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
          <Text fontSize={14} color={THEME.colors.textMuted} textAlign="center" lineHeight={1.5}>
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

          <XStack alignItems="center" justifyContent="space-between">
            <Button
              backgroundColor="transparent"
              borderWidth={0}
              padding={0}
              alignItems="center"
              gap="$2"
              onPress={() => setRememberEmail((remember) => !remember)}
            >
              <XStack alignItems="center" gap="$2">
                <View
                  width={20}
                  height={20}
                  borderRadius={5}
                  borderWidth={1}
                  borderColor={rememberEmail ? THEME.colors.primary : THEME.colors.border}
                  backgroundColor={rememberEmail ? THEME.colors.primary : '#FFFFFF'}
                  alignItems="center"
                  justifyContent="center"
                >
                  {rememberEmail && <Text color="#FFFFFF" fontSize={13}>✓</Text>}
                </View>
                <Text fontSize={13} color={THEME.colors.textMain}>Ghi nhớ email</Text>
              </XStack>
            </Button>
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
            disabled={googleLoading}
            size="large"
          />
        </YStack>

        <XStack alignItems="center" gap="$3" paddingTop="$1">
          <View flex={1} height={1} backgroundColor={THEME.colors.border} />
          <Text fontSize={11} color={THEME.colors.textMuted}>HOẶC TIẾP TỤC VỚI</Text>
          <View flex={1} height={1} backgroundColor={THEME.colors.border} />
        </XStack>

        <CustomButton
          title="Tiếp tục với Google"
          onPress={handleGoogleLogin}
          loading={googleLoading}
          disabled={loading}
          variant="outline"
          size="medium"
          icon={<Text color="#4285F4" fontSize={19} fontWeight="800">G</Text>}
        />

        <XStack justifyContent="center" gap="$2">
          <Text fontSize={14} color={THEME.colors.textMuted}>Chưa có tài khoản?</Text>
          <Button backgroundColor="transparent" borderWidth={0} paddingHorizontal={0} onPress={() => router.push('/register')}>
            <Text fontSize={14} fontWeight="700" color={THEME.colors.primaryDark}>Đăng ký ngay</Text>
          </Button>
        </XStack>

        <View
          alignSelf="center"
          paddingHorizontal="$3"
          paddingVertical="$1"
          backgroundColor={THEME.colors.primaryLight}
          borderRadius={THEME.radius.full}
        >
          <Text fontSize={11} color={THEME.colors.textMuted}>● Bảo mật bởi Supabase Auth</Text>
        </View>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
