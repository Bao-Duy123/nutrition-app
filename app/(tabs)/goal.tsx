import React, { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner, View } from 'tamagui';
import { Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { setProfile } from '../../src/store/slices/authSlice';
import {
  getUserProfile,
  getWeightHistory,
  addWeightRecord,
  updateUserProfile,
  getTodayDateString,
} from '../../src/services/supabase';
import {
  calculateBMR,
  calculateTDEE,
  calculateSuggestedCalorie,
} from '../../src/utils/calculateMacro';
import { THEME } from '../../src/constants/theme';
import { WeightHistory } from '../../src/types/database';

export default function GoalScreen() {
  const dispatch = useAppDispatch();
  const { userId, profile } = useAppSelector((state) => state.auth);

  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  // Fetch dữ liệu mục tiêu & lịch sử cân nặng
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // 1. Lấy thông tin profile người dùng
      const { data: profileData } = await getUserProfile(userId);
      if (profileData) {
        dispatch(setProfile(profileData));
      }

      // 2. Lấy dữ liệu từ bảng weight_history
      const { data: historyData } = await getWeightHistory(userId);
      if (historyData) {
        setWeightHistory(historyData);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu mục tiêu:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Thêm cân nặng mới
  const handleAddWeight = async () => {
    if (!userId) return;
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập cân nặng hợp lệ (kg)!');
      return;
    }

    try {
      setSavingWeight(true);
      const todayStr = getTodayDateString();

      // Thêm vào bảng weight_history
      const { data, error } = await addWeightRecord(userId, weightNum, todayStr);
      if (error) {
        Alert.alert('Lỗi lưu cân nặng', error.message);
        return;
      }

      // Đồng thời cập nhật current_weight trong bảng profiles
      await updateUserProfile(userId, { current_weight: weightNum });
      if (profile) {
        dispatch(setProfile({ ...profile, current_weight: weightNum }));
      }

      Alert.alert('Thành công', `Đã cập nhật cân nặng: ${weightNum} kg`);
      setNewWeight('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu cân nặng');
    } finally {
      setSavingWeight(false);
    }
  };

  // Tính toán số liệu đề xuất
  const currentWeight = Number(profile?.current_weight || 65);
  const targetWeight = Number(profile?.target_weight || 60);
  const height = Number(profile?.height || 170);
  const age = Number(profile?.age || 25);
  const gender = profile?.gender || 'Nam';
  const goalType = profile?.goal_type || 'Giảm cân';

  const bmr = calculateBMR(currentWeight, height, age, gender);
  const tdee = calculateTDEE(bmr);
  const suggestedCalories = calculateSuggestedCalorie(tdee, goalType);

  // Tính chênh lệch cân nặng và thời gian ước tính (0.5kg/tuần)
  const weightDiff = Math.abs(currentWeight - targetWeight);
  const estimatedWeeks = weightDiff > 0 ? Math.ceil(weightDiff / 0.5) : 0;

  // Lấy giá trị min, max cho biểu đồ cân nặng
  const weights = weightHistory.map((w) => Number(w.weight));
  const minWeight = weights.length > 0 ? Math.min(...weights, targetWeight) - 2 : 50;
  const maxWeight = weights.length > 0 ? Math.max(...weights, currentWeight) + 2 : 80;
  const weightRange = Math.max(1, maxWeight - minWeight);

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack padding="$4" gap="$4">
        {/* HEADER */}
        <YStack gap="$1">
          <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain}>
            Mục Tiêu & Thể Trạng 🎯
          </Text>
          <Text fontSize={13} color={THEME.colors.textMuted}>
            Theo dõi tiến trình cân nặng và kế hoạch calo cá nhân
          </Text>
        </YStack>

        {/* CARD SO SÁNH: MỤC TIÊU, THỜI GIAN, CALO ĐỀ XUẤT */}
        <YStack
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.border}
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
              Kế hoạch: {goalType}
            </Text>
            <View
              backgroundColor={THEME.colors.primaryLight}
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={THEME.radius.sm}
            >
              <Text fontSize={12} fontWeight="700" color={THEME.colors.primaryDark}>
                BMI: {(currentWeight / ((height / 100) * (height / 100))).toFixed(1)}
              </Text>
            </View>
          </XStack>

          <XStack gap="$3" paddingTop="$2">
            {/* Cột 1: Mục tiêu (kg) */}
            <YStack
              flex={1}
              backgroundColor={THEME.colors.background}
              padding="$3"
              borderRadius={THEME.radius.md}
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="600" color={THEME.colors.textMuted} textTransform="uppercase">
                Mục tiêu (kg)
              </Text>
              <Text fontSize={20} fontWeight="800" color={THEME.colors.textMain}>
                {targetWeight}
              </Text>
              <Text fontSize={11} color={currentWeight > targetWeight ? THEME.colors.danger : THEME.colors.primary}>
                Hiện tại: {currentWeight} kg
              </Text>
            </YStack>

            {/* Cột 2: Thời gian ước tính */}
            <YStack
              flex={1}
              backgroundColor={THEME.colors.background}
              padding="$3"
              borderRadius={THEME.radius.md}
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="600" color={THEME.colors.textMuted} textTransform="uppercase">
                Thời gian
              </Text>
              <Text fontSize={20} fontWeight="800" color={THEME.colors.primaryDark}>
                ~{estimatedWeeks}
              </Text>
              <Text fontSize={11} color={THEME.colors.textMuted}>
                tuần (0.5kg/w)
              </Text>
            </YStack>

            {/* Cột 3: Calo đề xuất */}
            <YStack
              flex={1}
              backgroundColor={THEME.colors.background}
              padding="$3"
              borderRadius={THEME.radius.md}
              alignItems="center"
              gap="$1"
            >
              <Text fontSize={11} fontWeight="600" color={THEME.colors.textMuted} textTransform="uppercase">
                Calo đề xuất
              </Text>
              <Text fontSize={20} fontWeight="800" color={THEME.colors.calories}>
                {suggestedCalories}
              </Text>
              <Text fontSize={11} color={THEME.colors.textMuted}>
                kcal / ngày
              </Text>
            </YStack>
          </XStack>
        </YStack>

        {/* BIỂU ĐỒ TIẾN TRÌNH CÂN NẶNG TỪ BẢNG WEIGHT_HISTORY */}
        <YStack
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.border}
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
              Biểu đồ cân nặng (Line Chart) 📈
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted}>
              {weightHistory.length} mốc ghi nhận
            </Text>
          </XStack>

          {loading ? (
            <YStack padding="$6" alignItems="center">
              <Spinner size="large" color={THEME.colors.primary} />
            </YStack>
          ) : weightHistory.length === 0 ? (
            <YStack padding="$4" alignItems="center" gap="$2">
              <Text fontSize={32}>⚖️</Text>
              <Text fontSize={14} color={THEME.colors.textMuted}>
                Chưa có dữ liệu lịch sử cân nặng. Hãy nhập số cân nặng hôm nay bên dưới!
              </Text>
            </YStack>
          ) : (
            <YStack gap="$3" paddingTop="$2">
              {/* VÙNG HIỂN THỊ BIỂU ĐỒ TRỰC QUAN */}
              <View
                height={160}
                backgroundColor={THEME.colors.background}
                borderRadius={THEME.radius.md}
                padding="$3"
                justifyContent="flex-end"
              >
                <XStack height="100%" alignItems="flex-end" justifyContent="space-around">
                  {weightHistory.slice(-7).map((item, index) => {
                    const hPercent = Math.min(
                      100,
                      Math.max(15, Math.round(((Number(item.weight) - minWeight) / weightRange) * 100))
                    );

                    return (
                      <YStack key={item.id || index} alignItems="center" gap="$1">
                        <Text fontSize={11} fontWeight="700" color={THEME.colors.textMain}>
                          {item.weight}
                        </Text>
                        {/* Cột biểu đồ */}
                        <View
                          width={24}
                          height={`${hPercent}%`}
                          backgroundColor={
                            item.weight <= targetWeight ? THEME.colors.primary : THEME.colors.calories
                          }
                          borderRadius={6}
                        />
                        <Text fontSize={10} color={THEME.colors.textMuted}>
                          {item.recorded_date.slice(5)}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
              </View>

              <XStack justifyContent="space-between" paddingHorizontal="$1">
                <Text fontSize={11} color={THEME.colors.textMuted}>
                  Mục tiêu lý tưởng: <Text fontWeight="700" color={THEME.colors.primary}>{targetWeight} kg</Text>
                </Text>
                <Text fontSize={11} color={THEME.colors.textMuted}>
                  Thấp nhất: {minWeight + 2} kg | Cao nhất: {maxWeight - 2} kg
                </Text>
              </XStack>
            </YStack>
          )}
        </YStack>

        {/* FORM GHI NHẬN CÂN NẶNG HÔM NAY */}
        <YStack
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.border}
          gap="$3"
        >
          <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
            Ghi nhận cân nặng hôm nay
          </Text>

          <XStack gap="$3" alignItems="center">
            <Input
              flex={1}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="Nhập cân nặng (vd: 64.5)"
              keyboardType="numeric"
              backgroundColor={THEME.colors.background}
              borderRadius={THEME.radius.md}
              height={46}
            />

            <Button
              backgroundColor={THEME.colors.primary}
              borderRadius={THEME.radius.md}
              height={46}
              paddingHorizontal="$4"
              disabled={savingWeight}
              onPress={handleAddWeight}
            >
              <Text fontSize={13} fontWeight="700" color="#FFFFFF">
                {savingWeight ? 'Đang lưu...' : 'Lưu lại'}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
