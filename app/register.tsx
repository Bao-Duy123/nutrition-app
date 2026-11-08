import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import { CustomButton } from '../src/components/CustomButton';
import { THEME } from '../src/constants/theme';
import {
  formatSupabaseError,
  logSupabaseError,
  logUnexpectedError,
  supabase,
  upsertUserProfile,
} from '../src/services/supabase';
import { useAppDispatch } from '../src/store';
import { setProfile, setSession } from '../src/store/slices/authSlice';
import { setDailyCalorieGoal } from '../src/store/slices/dietSlice';
import { calculateBMR, calculateSuggestedCalorie, calculateTDEE } from '../src/utils/calculateMacro';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showHealthProfile, setShowHealthProfile] = useState(false);
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('65');
  const [targetWeight, setTargetWeight] = useState('60');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [goalType, setGoalType] = useState('Giảm cân');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const parsedAge = Number(age);
    const parsedHeight = Number(height);
    const parsedWeight = Number(currentWeight);
    const parsedTargetWeight = Number(targetWeight);

    if (!fullName.trim() || !normalizedEmail || !password || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Email không hợp lệ', 'Vui lòng kiểm tra lại địa chỉ email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Mật khẩu chưa đủ mạnh', 'Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Vui lòng nhập lại mật khẩu xác nhận.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Cần xác nhận', 'Vui lòng đồng ý với điều khoản để tiếp tục.');
      return;
    }
    if (
      !Number.isFinite(parsedAge) || parsedAge < 13 ||
      !Number.isFinite(parsedHeight) || parsedHeight <= 0 ||
      !Number.isFinite(parsedWeight) || parsedWeight <= 0 ||
      !Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0
    ) {
      Alert.alert('Thông số chưa hợp lệ', 'Kiểm tra lại tuổi, chiều cao và cân nặng.');
      return;
    }

    try {
      setLoading(true);
      const bmr = calculateBMR(parsedWeight, parsedHeight, parsedAge, gender);
      const dailyCalorieGoal = calculateSuggestedCalorie(calculateTDEE(bmr), goalType);
      const appProfile = {
        full_name: fullName.trim(),
        gender,
        age: parsedAge,
        height: parsedHeight,
        current_weight: parsedWeight,
        target_weight: parsedTargetWeight,
        goal_type: goalType,
        daily_calorie_goal: dailyCalorieGoal,
      };
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: fullName.trim(), app_profile: appProfile } },
      });

      if (error) {
        const detail = logSupabaseError('auth.signUp', error);
        Alert.alert('Đăng ký thất bại', detail);
        return;
      }

      if (!data.user) {
        console.error('[Supabase][auth.signUp] Signup succeeded without a user object.', {
          hasSession: Boolean(data.session),
        });
        Alert.alert(
          'Đăng ký chưa hoàn tất',
          'Supabase không trả về tài khoản. Kiểm tra cấu hình Auth và log [Supabase][auth.signUp].'
        );
        return;
      }

      if (data.user.identities?.length === 0) {
        Alert.alert(
          'Email đã được đăng ký',
          'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng chức năng Quên mật khẩu.',
          [{ text: 'Đến đăng nhập', onPress: () => router.replace('/login') }]
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Kiểm tra email để xác nhận',
          'Tài khoản đã tạo. Hãy xác nhận email, sau đó đăng nhập. Hồ sơ sức khỏe sẽ được lưu tự động sau lần đăng nhập đầu tiên.',
          [{ text: 'Đến đăng nhập', onPress: () => router.replace('/login') }]
        );
        return;
      }

      const { data: profile, error: profileError } = await upsertUserProfile({
        id: data.user.id,
        ...appProfile,
      });
      if (profileError || !profile) {
        const detail = profileError
          ? formatSupabaseError(profileError)
          : 'Supabase không trả về hồ sơ sau khi lưu. Kiểm tra log [Supabase][profiles.upsert].';
        Alert.alert(
          'Tài khoản đã tạo nhưng chưa lưu được hồ sơ',
          detail,
          [{ text: 'Đến đăng nhập', onPress: () => router.replace('/login') }]
        );
        return;
      }

      dispatch(setSession(data.session));
      dispatch(setProfile(profile));
      dispatch(setDailyCalorieGoal(dailyCalorieGoal));
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Lỗi hệ thống', logUnexpectedError('auth.signUp', error));
    } finally {
      setLoading(false);
    }
  };

  const goalOptions = ['Giảm cân', 'Giữ cân', 'Tăng cân'];

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Button
            circular
            width={40}
            height={40}
            backgroundColor="transparent"
            onPress={() => router.back()}
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
            <Text fontSize={18} fontWeight="800" color={THEME.colors.textMain}>Sign Up</Text>
          </XStack>
          <Button
            circular
            width={40}
            height={40}
            backgroundColor={THEME.colors.primaryDark}
            onPress={() => router.push('/login')}
          >
            <Text color="#FFFFFF" fontSize={16}>♙</Text>
          </Button>
        </XStack>

        <YStack gap="$2">
          <View
            alignSelf="flex-start"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={THEME.radius.full}
            backgroundColor={THEME.colors.primaryLight}
          >
            <Text fontSize={11} color={THEME.colors.primaryDark} fontWeight="700">
              ◉ Bước {showHealthProfile ? '2/2: Hồ sơ sức khỏe' : '1/2: Tài khoản hội viên'}
            </Text>
          </View>
          <Text fontSize={25} fontWeight="800" color={THEME.colors.textMain}>
            Tạo tài khoản mới
          </Text>
          <Text fontSize={14} color={THEME.colors.textMuted} lineHeight={21}>
            Bắt đầu hành trình theo dõi calo và quản lý cân nặng khoa học ngay hôm nay.
          </Text>
        </YStack>

        <YStack
          backgroundColor={THEME.colors.card}
          padding="$4"
          borderRadius={28}
          borderWidth={1}
          borderColor={THEME.colors.borderLight}
          gap="$3"
        >
          <YStack gap="$2">
            <Text fontSize={13} fontWeight="700" color={THEME.colors.textMain}>Họ và tên</Text>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              backgroundColor={THEME.colors.background}
              borderWidth={0}
              borderRadius={THEME.radius.full}
              height={46}
              paddingHorizontal="$4"
            />
          </YStack>
          <YStack gap="$2">
            <Text fontSize={13} fontWeight="700" color={THEME.colors.textMain}>Địa chỉ Email</Text>
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
              height={46}
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
                placeholder="Tối thiểu 8 ký tự"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                backgroundColor="transparent"
                borderWidth={0}
                height={46}
                paddingHorizontal="$4"
              />
              <Button
                backgroundColor="transparent"
                borderWidth={0}
                onPress={() => setShowPassword((visible) => !visible)}
              >
                <Text fontSize={12} color={THEME.colors.textMuted}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
              </Button>
            </XStack>
          </YStack>
          <YStack gap="$2">
            <Text fontSize={13} fontWeight="700" color={THEME.colors.textMain}>Xác nhận mật khẩu</Text>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              backgroundColor={THEME.colors.background}
              borderWidth={0}
              borderRadius={THEME.radius.full}
              height={46}
              paddingHorizontal="$4"
            />
          </YStack>

          <XStack alignItems="center" gap="$2" onPress={() => setAcceptedTerms((accepted) => !accepted)}>
            <View
              width={20}
              height={20}
              borderRadius={5}
              borderWidth={1}
              borderColor={acceptedTerms ? THEME.colors.primary : THEME.colors.textLight}
              backgroundColor={acceptedTerms ? THEME.colors.primary : '#FFFFFF'}
              alignItems="center"
              justifyContent="center"
            >
              {acceptedTerms && <Text color="#FFFFFF" fontSize={13}>✓</Text>}
            </View>
            <Text flex={1} fontSize={12} color={THEME.colors.textMuted}>
              Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật sức khỏe.
            </Text>
          </XStack>

          <CustomButton
            title="Tiếp tục thiết lập hồ sơ  →"
            onPress={() => {
              if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
                Alert.alert('Thiếu thông tin', 'Vui lòng điền họ tên, email và mật khẩu.');
                return;
              }
              if (password.length < 8 || password !== confirmPassword) {
                Alert.alert('Kiểm tra mật khẩu', 'Mật khẩu cần đủ 8 ký tự và khớp với phần xác nhận.');
                return;
              }
              if (!acceptedTerms) {
                Alert.alert('Cần xác nhận', 'Vui lòng đồng ý với điều khoản để tiếp tục.');
                return;
              }
              setShowHealthProfile(true);
            }}
            size="large"
            variant="secondary"
          />
        </YStack>

        {showHealthProfile && (
          <YStack
            backgroundColor={THEME.colors.card}
            padding="$4"
            borderRadius={24}
            borderWidth={1}
            borderColor={THEME.colors.borderLight}
            gap="$3"
          >
          <YStack gap="$1">
            <Text fontSize={16} fontWeight="800" color={THEME.colors.textMain}>Thông số cơ thể</Text>
            <Text fontSize={12} color={THEME.colors.textMuted}>
              Dùng để tính mục tiêu calo ban đầu. Bạn có thể sửa sau.
            </Text>
          </YStack>
          <XStack gap="$2">
            {(['Nam', 'Nữ'] as const).map((value) => (
              <Button
                key={value}
                flex={1}
                backgroundColor={gender === value ? THEME.colors.primary : THEME.colors.background}
                onPress={() => setGender(value)}
              >
                <Text color={gender === value ? '#FFFFFF' : THEME.colors.textMain} fontWeight="700">
                  {value === 'Nam' ? '♂ Nam' : '♀ Nữ'}
                </Text>
              </Button>
            ))}
          </XStack>
          <XStack gap="$2">
            {[
              { label: 'Tuổi', value: age, setValue: setAge },
              { label: 'Chiều cao (cm)', value: height, setValue: setHeight },
            ].map((field) => (
              <YStack key={field.label} flex={1} gap="$1">
                <Text fontSize={11} color={THEME.colors.textMuted}>{field.label}</Text>
                <Input
                  value={field.value}
                  onChangeText={field.setValue}
                  keyboardType="numeric"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>
            ))}
          </XStack>
          <XStack gap="$2">
            {[
              { label: 'Cân nặng (kg)', value: currentWeight, setValue: setCurrentWeight },
              { label: 'Mục tiêu (kg)', value: targetWeight, setValue: setTargetWeight },
            ].map((field) => (
              <YStack key={field.label} flex={1} gap="$1">
                <Text fontSize={11} color={THEME.colors.textMuted}>{field.label}</Text>
                <Input
                  value={field.value}
                  onChangeText={field.setValue}
                  keyboardType="numeric"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>
            ))}
          </XStack>
          <YStack gap="$1">
            <Text fontSize={11} color={THEME.colors.textMuted}>Mục tiêu</Text>
            <XStack gap="$2">
              {goalOptions.map((option) => (
                <Button
                  key={option}
                  flex={1}
                  paddingHorizontal="$1"
                  backgroundColor={goalType === option ? THEME.colors.primaryLight : THEME.colors.background}
                  borderWidth={goalType === option ? 1 : 0}
                  borderColor={THEME.colors.primary}
                  onPress={() => setGoalType(option)}
                >
                  <Text
                    fontSize={11}
                    fontWeight="700"
                    color={goalType === option ? THEME.colors.primaryDark : THEME.colors.textMuted}
                  >
                    {option}
                  </Text>
                </Button>
              ))}
            </XStack>
          </YStack>
          <CustomButton
            title="Tạo tài khoản & bắt đầu"
            onPress={handleRegister}
            loading={loading}
            size="large"
          />
          </YStack>
        )}

        <XStack justifyContent="center" gap="$2">
          <Text fontSize={14} color={THEME.colors.textMuted}>Đã có tài khoản?</Text>
          <Button backgroundColor="transparent" borderWidth={0} paddingHorizontal={0} onPress={() => router.push('/login')}>
            <Text fontSize={14} fontWeight="700" color={THEME.colors.primaryDark}>Đăng nhập ngay</Text>
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}
