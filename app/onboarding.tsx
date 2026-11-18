import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Button, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../src/components/AppInput';
import { CustomButton } from '../src/components/CustomButton';
import { THEME } from '../src/constants/theme';
import { CONFIG } from '../src/constants/config';
import {
  ensureUserProfile,
  formatSupabaseError,
  logSupabaseError,
  logUnexpectedError,
  supabase,
  upsertUserProfile,
} from '../src/services/supabase';
import { useAppDispatch, useAppSelector } from '../src/store';
import { setProfile, setSession, clearAuth } from '../src/store/slices/authSlice';
import { setDailyCalorieGoal } from '../src/store/slices/dietSlice';
import { calculateBMR, calculateSuggestedCalorie, calculateTDEE } from '../src/utils/calculateMacro';
import { useAppModal } from '../src/components/ModalProvider';
import { isProfileOnboarded } from '../src/utils/validation';

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modal = useAppModal();

  const { session, profile } = useAppSelector((state) => state.auth);

  // Form states cho thông tin sức khỏe bắt buộc
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('65');
  const [targetWeight, setTargetWeight] = useState('60');
  const [goalType, setGoalType] = useState('Giảm cân');
  const [loading, setLoading] = useState(false);

  // Tự động điền thông tin nếu đã có sẵn từ profile/user_metadata
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (session?.user?.user_metadata?.full_name) {
      setFullName(session.user.user_metadata.full_name);
    } else if (session?.user?.user_metadata?.name) {
      setFullName(session.user.user_metadata.name);
    }

    if (profile?.gender === 'Nam' || profile?.gender === 'Nữ') {
      setGender(profile.gender);
    }
    if (profile?.age) setAge(String(profile.age));
    if (profile?.height) setHeight(String(profile.height));
    if (profile?.current_weight) setCurrentWeight(String(profile.current_weight));
    if (profile?.target_weight) setTargetWeight(String(profile.target_weight));
    if (profile?.goal_type) setGoalType(profile.goal_type);

    // Nếu người dùng đã hoàn thành onboarding rồi thì vào thẳng Dashboard
    if (isProfileOnboarded(profile)) {
      router.replace('/(tabs)');
    }
  }, [profile, session, router]);

  const handleSubmit = async () => {
    const user = session?.user;
    if (!user) {
      void modal
        .alert({
          type: 'error',
          title: 'Phiên đăng nhập hết hạn',
          message: 'Vui lòng đăng nhập lại để tiếp tục.',
        })
        .then(() => {
          router.replace('/login');
        });
      return;
    }

    const trimmedName =
      fullName.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Người dùng';
    const parsedAge = Number(age);
    const parsedHeight = Number(height);
    const parsedWeight = Number(currentWeight);
    const parsedTargetWeight = Number(targetWeight);

    if (
      !Number.isFinite(parsedAge) ||
      parsedAge < 13 ||
      !Number.isFinite(parsedHeight) ||
      parsedHeight <= 0 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      !Number.isFinite(parsedTargetWeight) ||
      parsedTargetWeight <= 0
    ) {
      void modal.alert({
        type: 'warning',
        title: 'Thông số chưa hợp lệ',
        message: 'Vui lòng kiểm tra lại tuổi (tối thiểu 13), chiều cao và cân nặng.',
      });
      return;
    }

    try {
      setLoading(true);
      const bmr = calculateBMR(parsedWeight, parsedHeight, parsedAge, gender);
      const dailyCalorieGoal = calculateSuggestedCalorie(calculateTDEE(bmr), goalType);

      const appProfileData = {
        id: user.id,
        full_name: trimmedName,
        gender,
        age: parsedAge,
        height: parsedHeight,
        current_weight: parsedWeight,
        target_weight: parsedTargetWeight,
        goal_type: goalType,
        daily_calorie_goal: dailyCalorieGoal,
        bmr,
        tdee: calculateTDEE(bmr),
      };

      const { data: updatedProfile, error } = await upsertUserProfile(appProfileData);

      if (error || !updatedProfile) {
        const detail = error
          ? formatSupabaseError(error)
          : 'Không nhận được dữ liệu hồ sơ từ Supabase.';
        void modal.alert({
          type: 'error',
          title: 'Lưu thông tin thất bại',
          message: `${detail}\n\nVui lòng thử lại.`,
        });
        return;
      }

      // Cập nhật Redux store
      dispatch(setProfile(updatedProfile));
      dispatch(setDailyCalorieGoal(dailyCalorieGoal));

      // Chuyển vào giao diện chính
      router.replace('/(tabs)');
    } catch (err) {
      void modal.alert({
        type: 'error',
        title: 'Lỗi hệ thống',
        message: logUnexpectedError('onboarding.saveProfile', err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch(clearAuth());
      router.replace('/login');
    } catch (err) {
      logUnexpectedError('onboarding.logout', err);
      router.replace('/login');
    }
  };

  const goalOptions = ['Giảm cân', 'Giữ cân', 'Tăng cân'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.background }} edges={['top', 'right', 'bottom', 'left']}>
      <ScrollView
        flex={1}
        backgroundColor={THEME.colors.background}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack width="100%" maxWidth={440} alignSelf="center" gap="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$1">
              <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain}>
                Thiết lập hồ sơ sức khỏe
              </Text>
              <Text fontSize={13} color={THEME.colors.textMuted}>
                Đăng nhập bởi: {session?.user?.email}
              </Text>
            </YStack>
            <Button
              backgroundColor="transparent"
              borderWidth={0}
              paddingHorizontal="$2"
              onPress={handleLogout}
            >
              <Text fontSize={12} color={THEME.colors.danger} fontWeight="600">
                Đăng xuất
              </Text>
            </Button>
          </XStack>

          {/* <Text  color={THEME.colors.textMuted} lineHeight={19}>
            Vui lòng hoàn thành các thông số cơ thể ban đầu để hệ thống tự động tính toán mục tiêu calo, BMR và TDEE chính xác nhất cho bạn.
          </Text> */}

          {/* Form Card */}
          <YStack
            backgroundColor={THEME.colors.card}
            padding="$4"
            borderRadius={24}
            borderWidth={1}
            borderColor={THEME.colors.borderLight}
            gap="$3.5"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.04}
            shadowRadius={8}
          >
            {/* Họ và tên */}
            <YStack gap="$1">
              <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                Họ và tên
              </Text>
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên của bạn"
                backgroundColor={THEME.colors.background}
                borderWidth={0}
                borderRadius={THEME.radius.md}
              />
            </YStack>

            {/* Giới tính */}
            <YStack gap="$1">
              <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                Giới tính sinh học
              </Text>
              <XStack gap="$2">
                {(['Nam', 'Nữ'] as const).map((value) => (
                  <Button
                    key={value}
                    flex={1}
                    height={44}
                    backgroundColor={gender === value ? THEME.colors.primary : THEME.colors.background}
                    borderWidth={gender === value ? 0 : 1}
                    borderColor={THEME.colors.borderLight}
                    onPress={() => setGender(value)}
                  >
                    <Text
                      color={gender === value ? '#FFFFFF' : THEME.colors.textMain}
                      fontWeight="700"
                      fontSize={14}
                    >
                      {value === 'Nam' ? '♂ Nam' : '♀ Nữ'}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Tuổi & Chiều cao */}
            <XStack gap="$2">
              <YStack flex={1} gap="$1">
                <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                  Tuổi (năm)
                </Text>
                <Input
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="25"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>

              <YStack flex={1} gap="$1">
                <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                  Chiều cao (cm)
                </Text>
                <Input
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="170"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>
            </XStack>

            {/* Cân nặng hiện tại & Cân nặng mục tiêu */}
            <XStack gap="$2">
              <YStack flex={1} gap="$1">
                <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                  Cân nặng hiện tại (kg)
                </Text>
                <Input
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="numeric"
                  placeholder="65"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>

              <YStack flex={1} gap="$1">
                <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                  Mục tiêu (kg)
                </Text>
                <Input
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="numeric"
                  placeholder="60"
                  backgroundColor={THEME.colors.background}
                  borderWidth={0}
                  borderRadius={THEME.radius.md}
                />
              </YStack>
            </XStack>

            {/* Mục tiêu thay đổi cân nặng */}
            <YStack gap="$1.5">
              <Text fontSize={12} fontWeight="700" color={THEME.colors.textMain}>
                Mục tiêu cân nặng
              </Text>
              <XStack gap="$2">
                {goalOptions.map((option) => (
                  <Button
                    key={option}
                    flex={1}
                    height={40}
                    backgroundColor={goalType === option ? THEME.colors.primaryLight : THEME.colors.background}
                    borderWidth={goalType === option ? 1.5 : 0}
                    borderColor={THEME.colors.primary}
                    onPress={() => setGoalType(option)}
                  >
                    <Text
                      fontSize={12}
                      fontWeight="700"
                      color={goalType === option ? THEME.colors.primaryDark : THEME.colors.textMuted}
                    >
                      {option}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </YStack>

            {/* Submit button */}
            <CustomButton
              title="Hoàn tất & Vào ứng dụng  →"
              onPress={handleSubmit}
              loading={loading}
              size="large"
            />
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
