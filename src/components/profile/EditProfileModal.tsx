import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, Platform } from 'react-native';
import { YStack, XStack, Text, Button, View, Spinner } from 'tamagui';
import {Input} from '../AppInput'
import { THEME } from '../../constants/theme';
import { Profile } from '../../types/database';
import {
  ACTIVITY_LEVELS,
  computeNutritionMetrics,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieGoal,
} from '../../utils/nutrition';
import { upsertProfile } from '../../services/profileService';
import { showAlert } from '../../utils/showAlert';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  userId: string;
  onSuccess: (updatedProfile: Profile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profile,
  userId,
  onSuccess,
}) => {
  // Form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('65');
  const [activityLevel, setActivityLevel] = useState('Vận động nhẹ');
  const [goalType, setGoalType] = useState('Giảm cân');
  const [targetDays, setTargetDays] = useState('60');

  // UI state
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Điền dữ liệu khi mở modal hoặc profile thay đổi
  useEffect(() => {
    if (visible && profile) {
      setFullName(profile.full_name || '');
      setGender(profile.gender || 'Nam');
      setAge(profile.age ? String(profile.age) : '28');
      setHeight(profile.height ? String(profile.height) : '170');
      setCurrentWeight(profile.current_weight ? String(profile.current_weight) : '70');
      setTargetWeight(profile.target_weight ? String(profile.target_weight) : '65');
      setActivityLevel(profile.activity_level || 'Vận động nhẹ');
      setGoalType(profile.goal_type || 'Giảm cân');
      setTargetDays(profile.target_days ? String(profile.target_days) : '60');
      setValidationError(null);
    }
  }, [visible, profile]);

  // Tính toán thời gian thực các chỉ số BMR, TDEE, Calorie Goal
  const numWeight = parseFloat(currentWeight) || 70;
  const numHeight = parseFloat(height) || 170;
  const numAge = parseInt(age, 10) || 28;
  const numTargetWeight = parseFloat(targetWeight) || 65;
  const numTargetDays = parseInt(targetDays, 10) || 60;

  const liveMetrics = computeNutritionMetrics({
    currentWeight: numWeight,
    height: numHeight,
    age: numAge,
    gender,
    activityLevel,
    goalType,
  });

  const bmi =
    numHeight > 0
      ? (numWeight / ((numHeight / 100) * (numHeight / 100))).toFixed(1)
      : '22.0';

  // Hàm validate các giá trị theo yêu cầu
  const validate = (): string | null => {
    if (!fullName.trim()) {
      return 'Họ và tên không được để trống.';
    }

    if (isNaN(numAge) || numAge < 10 || numAge > 100) {
      return 'Độ tuổi phải từ 10 đến 100 tuổi.';
    }

    if (isNaN(numHeight) || numHeight < 100 || numHeight > 250) {
      return 'Chiều cao phải từ 100 cm đến 250 cm.';
    }

    if (isNaN(numWeight) || numWeight < 20 || numWeight > 300) {
      return 'Cân nặng hiện tại phải từ 20 kg đến 300 kg.';
    }

    if (isNaN(numTargetWeight) || numTargetWeight < 20 || numTargetWeight > 300) {
      return 'Cân nặng mục tiêu phải từ 20 kg đến 300 kg.';
    }

    if (targetDays && (isNaN(numTargetDays) || numTargetDays <= 0)) {
      return 'Số ngày đạt mục tiêu phải lớn hơn 0.';
    }

    return null;
  };

  const handleSave = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      setValidationError(errorMsg);
      showAlert('Lỗi nhập liệu', errorMsg);
      return;
    }

    setValidationError(null);
    setSaving(true);

    try {
      const payload: Partial<Profile> & { id: string } = {
        id: userId,
        full_name: fullName.trim(),
        gender,
        age: numAge,
        height: numHeight,
        current_weight: numWeight,
        target_weight: numTargetWeight,
        activity_level: activityLevel,
        goal_type: goalType,
        target_days: numTargetDays,
        bmr: liveMetrics.bmr,
        tdee: liveMetrics.tdee,
        daily_calorie_goal: liveMetrics.dailyCalorieGoal,
        avatar_url: profile?.avatar_url || null,
        subscription_tier: profile?.subscription_tier || 'Gói Hội Viên Pro - Tự do cân chỉnh',
      };

      const { data, error } = await upsertProfile(payload);

      if (error) {
        const msg = error.message || 'Không thể cập nhật hồ sơ vào Supabase.';
        setValidationError(msg);
        showAlert('Lỗi cập nhật', msg);
        return;
      }

      if (data) {
        showAlert('Thành công', 'Thông tin cá nhân & chỉ số dinh dưỡng đã được cập nhật!');
        onSuccess(data);
        onClose();
      }
    } catch (err: any) {
      const msg = err.message || 'Đã xảy ra lỗi không mong muốn.';
      setValidationError(msg);
      showAlert('Lỗi ngoại lệ', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <YStack flex={1} backgroundColor={THEME.colors.background}>
        {/* MODAL HEADER */}
        <XStack
          paddingHorizontal="$4"
          paddingTop={Platform.OS === 'ios' ? 50 : 20}
          paddingBottom="$3"
          backgroundColor={THEME.colors.card}
          borderBottomWidth={1}
          borderBottomColor={THEME.colors.borderLight}
          alignItems="center"
          justifyContent="space-between"
        >
          <Button backgroundColor="transparent" borderWidth={0} paddingHorizontal="$2" onPress={onClose} disabled={saving}>
            <Text fontSize={15} color={THEME.colors.textMuted}>
              Hủy
            </Text>
          </Button>

          <Text fontSize={17} fontWeight="800" color={THEME.colors.textMain}>
            Chỉnh sửa thông tin
          </Text>

          <Button
            backgroundColor={THEME.colors.primary}
            borderRadius={THEME.radius.md}
            paddingHorizontal="$3.5"
            paddingVertical="$2"
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Spinner size="small" color="#FFFFFF" />
            ) : (
              <Text fontSize={14} fontWeight="700" color="#FFFFFF">
                Lưu
              </Text>
            )}
          </Button>
        </XStack>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <YStack gap="$4">
            {/* THÔNG BÁO LỖI NẾU CÓ */}
            {validationError ? (
              <View
                backgroundColor="#FEE2E2"
                borderColor="#F87171"
                borderWidth={1}
                padding="$3"
                borderRadius={THEME.radius.md}
              >
                <Text fontSize={13} color={THEME.colors.danger} fontWeight="600">
                  ⚠️ {validationError}
                </Text>
              </View>
            ) : null}

            {/* 1. THÔNG TIN CÁ NHÂN CƠ BẢN */}
            <YStack
              backgroundColor={THEME.colors.card}
              padding="$4"
              borderRadius={THEME.radius.lg}
              borderWidth={1}
              borderColor={THEME.colors.borderLight}
              gap="$3"
            >
              <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
                Thông tin cá nhân
              </Text>

              {/* Họ và tên */}
              <YStack gap="$1.5">
                <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                  Họ và tên
                </Text>
                <Input
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                  backgroundColor={THEME.colors.background}
                  borderRadius={THEME.radius.md}
                  borderColor={THEME.colors.border}
                  height={44}
                  paddingHorizontal="$3"
                />
              </YStack>

              {/* Giới tính sinh học */}
              <YStack gap="$1.5">
                <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                  Giới tính sinh học
                </Text>
                <XStack gap="$3">
                  <Button
                    flex={1}
                    height={42}
                    backgroundColor={gender === 'Nam' ? THEME.colors.primary : THEME.colors.background}
                    borderColor={gender === 'Nam' ? THEME.colors.primary : THEME.colors.border}
                    borderWidth={1}
                    borderRadius={THEME.radius.md}
                    onPress={() => setGender('Nam')}
                  >
                    <Text
                      fontSize={14}
                      fontWeight="700"
                      color={gender === 'Nam' ? '#FFFFFF' : THEME.colors.textMain}
                    >
                      ♂ Nam giới
                    </Text>
                  </Button>

                  <Button
                    flex={1}
                    height={42}
                    backgroundColor={gender === 'Nữ' ? THEME.colors.primary : THEME.colors.background}
                    borderColor={gender === 'Nữ' ? THEME.colors.primary : THEME.colors.border}
                    borderWidth={1}
                    borderRadius={THEME.radius.md}
                    onPress={() => setGender('Nữ')}
                  >
                    <Text
                      fontSize={14}
                      fontWeight="700"
                      color={gender === 'Nữ' ? '#FFFFFF' : THEME.colors.textMain}
                    >
                      ♀ Nữ giới
                    </Text>
                  </Button>
                </XStack>
              </YStack>

              {/* Tuổi & Chiều cao */}
              <XStack gap="$3">
                <YStack flex={1} gap="$1.5">
                  <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                    Độ tuổi (10-100)
                  </Text>
                  <Input
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="28"
                    backgroundColor={THEME.colors.background}
                    borderRadius={THEME.radius.md}
                    borderColor={THEME.colors.border}
                    height={44}
                    paddingHorizontal="$3"
                  />
                </YStack>

                <YStack flex={1} gap="$1.5">
                  <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                    Chiều cao (100-250 cm)
                  </Text>
                  <Input
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="170"
                    backgroundColor={THEME.colors.background}
                    borderRadius={THEME.radius.md}
                    borderColor={THEME.colors.border}
                    height={44}
                    paddingHorizontal="$3"
                  />
                </YStack>
              </XStack>

              {/* Cân nặng hiện tại & Mục tiêu */}
              <XStack gap="$3">
                <YStack flex={1} gap="$1.5">
                  <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                    Cân nặng hiện tại (kg)
                  </Text>
                  <Input
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                    keyboardType="numeric"
                    placeholder="70"
                    backgroundColor={THEME.colors.background}
                    borderRadius={THEME.radius.md}
                    borderColor={THEME.colors.border}
                    height={44}
                    paddingHorizontal="$3"
                  />
                </YStack>

                <YStack flex={1} gap="$1.5">
                  <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                    Cân nặng mục tiêu (kg)
                  </Text>
                  <Input
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                    placeholder="65"
                    backgroundColor={THEME.colors.background}
                    borderRadius={THEME.radius.md}
                    borderColor={THEME.colors.border}
                    height={44}
                    paddingHorizontal="$3"
                  />
                </YStack>
              </XStack>
            </YStack>

            {/* 2. MỨC ĐỘ VẬN ĐỘNG (PAL) */}
            <YStack
              backgroundColor={THEME.colors.card}
              padding="$4"
              borderRadius={THEME.radius.lg}
              borderWidth={1}
              borderColor={THEME.colors.borderLight}
              gap="$3"
            >
              <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
                Mức độ vận động (PAL)
              </Text>

              <YStack gap="$2">
                {ACTIVITY_LEVELS.map((item) => {
                  const isSelected =
                    activityLevel.toLowerCase() === item.label.toLowerCase() ||
                    activityLevel.toLowerCase() === item.key.toLowerCase();

                  return (
                    <XStack
                      key={item.key}
                      padding="$3"
                      borderRadius={THEME.radius.md}
                      backgroundColor={isSelected ? '#E8EEFF' : THEME.colors.background}
                      borderWidth={1}
                      borderColor={isSelected ? THEME.colors.primary : THEME.colors.border}
                      alignItems="center"
                      justifyContent="space-between"
                      onPress={() => setActivityLevel(item.label)}
                      cursor="pointer"
                    >
                      <YStack gap="$0.5" flex={1}>
                        <Text
                          fontSize={14}
                          fontWeight="700"
                          color={isSelected ? THEME.colors.primaryDark : THEME.colors.textMain}
                        >
                          {item.label}
                        </Text>
                        <Text fontSize={12} color={THEME.colors.textMuted}>
                          {item.sublabel}
                        </Text>
                      </YStack>

                      <View
                        width={20}
                        height={20}
                        borderRadius={10}
                        borderWidth={2}
                        borderColor={isSelected ? THEME.colors.primary : THEME.colors.border}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isSelected ? (
                          <View
                            width={10}
                            height={10}
                            borderRadius={5}
                            backgroundColor={THEME.colors.primary}
                          />
                        ) : null}
                      </View>
                    </XStack>
                  );
                })}
              </YStack>
            </YStack>

            {/* 3. MỤC TIÊU & THỜI GIAN */}
            <YStack
              backgroundColor={THEME.colors.card}
              padding="$4"
              borderRadius={THEME.radius.lg}
              borderWidth={1}
              borderColor={THEME.colors.borderLight}
              gap="$3"
            >
              <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
                Mục tiêu thể trạng
              </Text>

              {/* Loại mục tiêu */}
              <XStack gap="$2">
                {['Giảm cân', 'Giữ cân', 'Tăng cân'].map((type) => {
                  const isSelected = goalType.toLowerCase().includes(type.toLowerCase());
                  return (
                    <Button
                      key={type}
                      flex={1}
                      height={40}
                      backgroundColor={isSelected ? THEME.colors.primary : THEME.colors.background}
                      borderColor={isSelected ? THEME.colors.primary : THEME.colors.border}
                      borderWidth={1}
                      borderRadius={THEME.radius.md}
                      onPress={() => setGoalType(type)}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="700"
                        color={isSelected ? '#FFFFFF' : THEME.colors.textMain}
                      >
                        {type}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>

              {/* Số ngày mục tiêu */}
              <YStack gap="$1.5">
                <Text fontSize={13} fontWeight="600" color={THEME.colors.textMuted}>
                  Thời gian đạt mục tiêu (ngày)
                </Text>
                <Input
                  value={targetDays}
                  onChangeText={setTargetDays}
                  keyboardType="numeric"
                  placeholder="60"
                  backgroundColor={THEME.colors.background}
                  borderRadius={THEME.radius.md}
                  borderColor={THEME.colors.border}
                  height={44}
                  paddingHorizontal="$3"
                />
              </YStack>
            </YStack>

            {/* 4. TÍNH TOÁN DINH DƯỠNG THỜI GIAN THỰC (PREVIEW) */}
            <YStack
              backgroundColor="#EFF6FF"
              padding="$4"
              borderRadius={THEME.radius.lg}
              borderWidth={1}
              borderColor="#BFDBFE"
              gap="$3"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={14} fontWeight="800" color={THEME.colors.primaryDark}>
                  Tính toán Dinh dưỡng (Mifflin-St Jeor)
                </Text>
                <View
                  backgroundColor="#DBEAFE"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={THEME.radius.sm}
                >
                  <Text fontSize={11} fontWeight="700" color={THEME.colors.primaryDark}>
                    BMI: {bmi}
                  </Text>
                </View>
              </XStack>

              <XStack gap="$2">
                <YStack
                  flex={1}
                  backgroundColor="#FFFFFF"
                  padding="$2.5"
                  borderRadius={THEME.radius.md}
                  alignItems="center"
                >
                  <Text fontSize={11} color={THEME.colors.textMuted}>
                    BMR cơ sở
                  </Text>
                  <Text fontSize={17} fontWeight="800" color={THEME.colors.textMain}>
                    {liveMetrics.bmr}
                  </Text>
                  <Text fontSize={10} color={THEME.colors.textLight}>
                    kcal/ngày
                  </Text>
                </YStack>

                <YStack
                  flex={1}
                  backgroundColor="#FFFFFF"
                  padding="$2.5"
                  borderRadius={THEME.radius.md}
                  alignItems="center"
                >
                  <Text fontSize={11} color={THEME.colors.textMuted}>
                    TDEE tiêu thụ
                  </Text>
                  <Text fontSize={17} fontWeight="800" color={THEME.colors.calories}>
                    {liveMetrics.tdee}
                  </Text>
                  <Text fontSize={10} color={THEME.colors.textLight}>
                    kcal/ngày
                  </Text>
                </YStack>

                <YStack
                  flex={1}
                  backgroundColor="#FFFFFF"
                  padding="$2.5"
                  borderRadius={THEME.radius.md}
                  alignItems="center"
                >
                  <Text fontSize={11} color={THEME.colors.textMuted}>
                    Calo mục tiêu
                  </Text>
                  <Text fontSize={17} fontWeight="800" color={THEME.colors.primary}>
                    {liveMetrics.dailyCalorieGoal}
                  </Text>
                  <Text fontSize={10} color={THEME.colors.textLight}>
                    kcal/ngày
                  </Text>
                </YStack>
              </XStack>
            </YStack>

            {/* NÚT LƯU THAY ĐỔI */}
            <Button
              backgroundColor={THEME.colors.primary}
              borderRadius={THEME.radius.md}
              height={48}
              onPress={handleSave}
              disabled={saving}
              marginTop="$2"
            >
              {saving ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text fontSize={15} fontWeight="700" color="#FFFFFF">
                  💾 Lưu & Cập nhật chỉ số dinh dưỡng
                </Text>
              )}
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </Modal>
  );
};
