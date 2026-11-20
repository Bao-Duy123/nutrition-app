import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Button, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import {Input} from '../src/components/AppInput'
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
  isInvalidCredentialsError,
  logSupabaseError,
  logUnexpectedError,
  supabase,
} from '../src/services/supabase';
import { useAppDispatch } from '../src/store';
import { setProfile, setSession } from '../src/store/slices/authSlice';
import { setDailyCalorieGoal } from '../src/store/slices/dietSlice';
import { useAppModal } from '../src/components/ModalProvider';
import { ForgotPasswordModal } from '../src/components/ForgotPasswordModal';
import GeminiTestBox from "../src/components/GeminiTestBox";
import { isUserOnboarded } from '../src/utils/validation';


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

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

    if (profileError) {
      void modal
        .alert({
          type: 'error',
          title: 'Không thể tải hồ sơ người dùng',
          message: `Đăng nhập thành công nhưng chưa thể lấy thông tin hồ sơ.\n\n${formatSupabaseError(profileError)}`,
        });
      return;
    }

    dispatch(setProfile(profile));
    if (profile?.daily_calorie_goal) {
      dispatch(setDailyCalorieGoal(profile.daily_calorie_goal));
    }

    // Kiểm tra xem người dùng đã hoàn thành onboarding / nhập thông số sức khỏe chưa
    if (isUserOnboarded(profile, session.user)) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  const handleLogin = async () => {
    if (loading || googleLoading) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      void modal.alert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập email và mật khẩu.',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      void modal.alert({
        type: 'error',
        title: 'Email không hợp lệ',
        message: 'Kiểm tra lại địa chỉ email rồi thử lại.',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (isInvalidCredentialsError(error)) {
          void modal.alert({
            type: 'error',
            title: 'Email hoặc mật khẩu chưa đúng',
            message:
              'Kiểm tra lại email và mật khẩu. Nếu bạn vừa đăng ký, hãy xác nhận email trước khi đăng nhập. Bạn cũng có thể dùng “Quên mật khẩu?” để đặt lại mật khẩu.',
          });
          return;
        }
        void modal.alert({
          type: 'error',
          title: 'Đăng nhập thất bại',
          message: logSupabaseError('auth.signInWithPassword', error),
        });
        return;
      }

      if (!data.session || !data.user) {
        console.error('[Supabase][auth.signInWithPassword] Authentication returned no session or user.', {
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user),
        });
        void modal.alert({
          type: 'error',
          title: 'Đăng nhập chưa hoàn tất',
          message:
            'Supabase không trả về phiên đăng nhập. Kiểm tra cấu hình Auth và log [Supabase][auth.signInWithPassword].',
        });
        return;
      }

      await completeLogin(data.session);
    } catch (error) {
      void modal.alert({
        type: 'error',
        title: 'Lỗi hệ thống',
        message: logUnexpectedError('auth.signInWithPassword', error),
      });
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
        void modal.alert({
          type: 'error',
          title: 'Không thể đăng nhập Google',
          message: logSupabaseError('auth.googleOAuth.start', error),
        });
        return;
      }
      if (!data.url) {
        void modal.alert({
          type: 'error',
          title: 'Không thể đăng nhập Google',
          message: 'Supabase không trả về liên kết OAuth.',
        });
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
        void modal.alert({
          type: 'error',
          title: 'Đăng nhập Google thất bại',
          message: logSupabaseError('auth.googleOAuth.callback', { message: callbackError }),
        });
        return;
      }

      const code = callbackUrl.searchParams.get('code');
      if (!code) {
        const oauthError = { message: 'OAuth callback did not contain an authorization code.' };
        console.error('[Supabase][auth.googleOAuth.callback]', oauthError);
        void modal.alert({
          type: 'error',
          title: 'Đăng nhập Google chưa hoàn tất',
          message: `${formatSupabaseError(oauthError)}\n\nKiểm tra Redirect URLs trong Supabase Auth.`,
        });
        return;
      }

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        void modal.alert({
          type: 'error',
          title: 'Không thể tạo phiên đăng nhập',
          message: logSupabaseError('auth.googleOAuth.exchangeCodeForSession', exchangeError),
        });
        return;
      }
      if (!sessionData.session) {
        void modal.alert({
          type: 'error',
          title: 'Đăng nhập Google chưa hoàn tất',
          message: 'Supabase không trả về phiên đăng nhập.',
        });
        return;
      }

      await completeLogin(sessionData.session);
    } catch (error) {
      void modal.alert({
        type: 'error',
        title: 'Lỗi đăng nhập Google',
        message: logUnexpectedError('auth.googleOAuth', error),
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.background }} edges={['top', 'right', 'bottom', 'left']}>
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

        <XStack alignItems="center" justifyContent="center" gap="$2">
          <Text fontSize={14} color={THEME.colors.textMuted}>Chưa có tài khoản?</Text>
          <Text
            fontSize={14}
            fontWeight="700"
            color={THEME.colors.primaryDark}
            onPress={() => router.push('/register')}
            role="link"
          >
            Đăng ký ngay
          </Text>
        </XStack>

        <View
          alignSelf="center"
          paddingHorizontal="$3"
          paddingVertical="$1"
         
        >

          {/* {__DEV__ && <GeminiTestBox />} */}
           <GeminiTestBox />

        </View>
        </YStack>
      </ScrollView>

      {/* MODAL QUÊN MẬT KHẨU BẰNG OTP */}
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
        initialEmail={email}
      />
    </SafeAreaView>
  );
}
