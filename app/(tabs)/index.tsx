import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ScrollView, Spinner, Text, View, XStack, YStack } from 'tamagui';
import { MacroRing } from '../../src/components/MacroRing';
import { THEME } from '../../src/constants/theme';
import { deleteMeal, getTodayDateString, getTodayMeals } from '../../src/services/supabase';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  removeMealItem,
  setDietError,
  setDietLoading,
  setTodayMeals,
} from '../../src/store/slices/dietSlice';
import { DailyMeal } from '../../src/types/database';
import { formatDisplayDate, getFriendlyDayName } from '../../src/utils/formatTime';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userId, profile } = useAppSelector((state) => state.auth);
  const {
    todayMeals,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    dailyCalorieGoal,
    isLoading,
    error,
  } = useAppSelector((state) => state.diet);
  const today = getTodayDateString();
  const calorieGoal = profile?.daily_calorie_goal || dailyCalorieGoal || 2000;
  const progress = Math.min(100, Math.round((totalCalories / calorieGoal) * 100));

  const fetchDailyData = useCallback(async () => {
    if (!userId) return;

    dispatch(setDietLoading(true));
    const { data, error: mealsError } = await getTodayMeals(userId, today);
    if (mealsError) {
      dispatch(setDietError(mealsError.message || 'Không thể tải nhật ký hôm nay.'));
    } else {
      dispatch(setTodayMeals(data));
    }
    dispatch(setDietLoading(false));
  }, [dispatch, today, userId]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  const handleDeleteMeal = async (mealId: number) => {
    const result = await deleteMeal(mealId);
    if (result.success) {
      dispatch(removeMealItem(mealId));
    } else {
      Alert.alert('Không thể xóa món ăn', result.error?.message || 'Vui lòng thử lại.');
    }
  };

  const greetingName = profile?.full_name?.trim().split(/\s+/).slice(-1)[0];

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" gap="$3">
            <View
              width={38}
              height={38}
              borderRadius={19}
              backgroundColor={THEME.colors.primaryLight}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={20} color={THEME.colors.primaryDark}>♨</Text>
            </View>
            <YStack gap="$1">
              <Text fontSize={12} color={THEME.colors.textMuted}>
                {greetingName ? `Chào ${greetingName}` : 'Theo dõi dinh dưỡng'}
              </Text>
              <Text fontSize={19} fontWeight="800" color={THEME.colors.textMain}>Trang Chủ</Text>
            </YStack>
          </XStack>
          <Button
            circular
            width={44}
            height={44}
            backgroundColor={THEME.colors.primaryDark}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text color="#FFFFFF" fontSize={17}>♙</Text>
          </Button>
        </XStack>

        <XStack
          backgroundColor={THEME.colors.card}
          borderRadius={24}
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack gap="$1">
            <Text fontSize={12} color={THEME.colors.textMuted}>⌖  Thành phố Hồ Chí Minh</Text>
            <Text fontSize={17} fontWeight="800" color={THEME.colors.textMain}>
              {getFriendlyDayName(today)}, {formatDisplayDate(today).replace('Ngày ', '')}
            </Text>
          </YStack>
          <View
            width={42}
            height={42}
            borderRadius={21}
            backgroundColor={THEME.colors.primaryLight}
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={19} color={THEME.colors.primaryDark}>▣</Text>
          </View>
        </XStack>

        <MacroRing
          calories={totalCalories}
          calorieGoal={calorieGoal}
          carbs={totalCarbs}
          protein={totalProtein}
          fat={totalFat}
        />

        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$1">
          <XStack alignItems="center" gap="$2">
            <Text fontSize={18} fontWeight="800" color={THEME.colors.textMain}>Bữa ăn hôm nay</Text>
            <View
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius={THEME.radius.full}
              backgroundColor={THEME.colors.primaryLight}
            >
              <Text fontSize={11} fontWeight="700" color={THEME.colors.primaryDark}>
                {todayMeals.length} món
              </Text>
            </View>
          </XStack>
          <Button
            backgroundColor="transparent"
            borderWidth={0}
            paddingHorizontal="$1"
            onPress={() => router.push('/(tabs)/diary')}
          >
            <Text fontSize={12} fontWeight="700" color={THEME.colors.primaryDark}>Tìm món</Text>
          </Button>
        </XStack>

        {isLoading ? (
          <YStack alignItems="center" padding="$5" gap="$2">
            <Spinner size="large" color={THEME.colors.primary} />
            <Text fontSize={13} color={THEME.colors.textMuted}>Đang tải dữ liệu từ Supabase...</Text>
          </YStack>
        ) : error ? (
          <YStack
            backgroundColor={THEME.colors.card}
            borderRadius={24}
            padding="$4"
            gap="$3"
          >
            <Text fontSize={14} color={THEME.colors.danger}>{error}</Text>
            <Button backgroundColor={THEME.colors.primary} onPress={fetchDailyData}>
              <Text color="#FFFFFF" fontWeight="700">Thử tải lại</Text>
            </Button>
          </YStack>
        ) : todayMeals.length === 0 ? (
          <YStack
            backgroundColor={THEME.colors.card}
            borderRadius={24}
            padding="$5"
            alignItems="center"
            gap="$2"
          >
            <Text fontSize={34}>🍽️</Text>
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Chưa có bữa ăn hôm nay
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} textAlign="center">
              Thêm món ăn để theo dõi lượng calo và dinh dưỡng.
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2">
            {todayMeals.map((meal: DailyMeal) => (
              <XStack
                key={meal.id}
                backgroundColor={THEME.colors.card}
                borderRadius={24}
                padding="$3"
                alignItems="center"
                gap="$3"
              >
                <View
                  width={54}
                  height={54}
                  borderRadius={15}
                  backgroundColor={THEME.colors.primaryLight}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={25}>🥗</Text>
                </View>
                <YStack flex={1} gap="$1">
                  <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain} numberOfLines={1}>
                    {meal.foods?.name || 'Món ăn'}
                  </Text>
                  <Text fontSize={12} color={THEME.colors.textMuted}>
                    {meal.quantity} khẩu phần · {meal.foods?.serving_size || meal.meal_time}
                  </Text>
                  <Text fontSize={12} color={THEME.colors.calories} fontWeight="700">
                    {Math.round(Number(meal.foods?.calories || 0) * Number(meal.quantity || 1))} kcal
                  </Text>
                </YStack>
                <Button
                  circular
                  width={36}
                  height={36}
                  backgroundColor={THEME.colors.background}
                  onPress={() => handleDeleteMeal(meal.id)}
                >
                  <Text fontSize={15} color={THEME.colors.textMuted}>›</Text>
                </Button>
              </XStack>
            ))}
          </YStack>
        )}

        <Button
          backgroundColor={THEME.colors.primary}
          borderRadius={THEME.radius.full}
          height={52}
          onPress={() => router.push('/(tabs)/diary')}
          shadowColor={THEME.colors.primary}
          shadowOffset={{ width: 0, height: 5 }}
          shadowOpacity={0.2}
          shadowRadius={8}
        >
          <Text color="#FFFFFF" fontSize={16} fontWeight="800">＋  Thêm bữa ăn</Text>
        </Button>

        <XStack
          alignItems="center"
          gap="$3"
          backgroundColor={THEME.colors.primaryLight}
          padding="$3"
          borderRadius={24}
        >
          <View
            width={38}
            height={38}
            borderRadius={19}
            backgroundColor={THEME.colors.primaryDark}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#FFFFFF" fontSize={18}>✓</Text>
          </View>
          <YStack flex={1} gap="$1">
            <Text fontSize={12} fontWeight="800" color={THEME.colors.textMain}>
              Đạt {progress}% mục tiêu ngày
            </Text>
            <Text fontSize={11} color={THEME.colors.textMuted}>
              {progress >= 100
                ? 'Bạn đã hoàn thành mục tiêu calo hôm nay.'
                : 'Duy trì thói quen để tiến gần hơn tới mục tiêu.'}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    </ScrollView>
  );
}
