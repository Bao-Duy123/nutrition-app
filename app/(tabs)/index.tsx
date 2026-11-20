import React, { useCallback, useEffect } from 'react';
import { Alert, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Button, ScrollView, Spinner, Text, View, XStack, YStack } from 'tamagui';
import { MacroRing } from '../../src/components/MacroRing';
import { THEME } from '../../src/constants/theme';
import { addMeal, deleteMeal, getTodayDateString, getTodayMeals } from '../../src/services/supabase';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  addMealItem,
  removeMealItem,
  setDietError,
  setDietLoading,
  setTodayMeals,
} from '../../src/store/slices/dietSlice';
import { DailyMeal } from '../../src/types/database';
import { formatDisplayDate, getFriendlyDayName } from '../../src/utils/formatTime';
import { useMealSuggestion } from '../../src/hooks/useMealSuggestion';
import { MealSuggestionList } from '../../src/components/MealSuggestionList';
import { MealSuggestion } from '../../src/hooks/useMealSuggestion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const calorieGoal = profile?.daily_calorie_goal ?? dailyCalorieGoal;
  const progress = calorieGoal > 0
    ? Math.min(100, Math.round((Math.max(0, totalCalories) / calorieGoal) * 100))
    : 0;
  const mealSuggestion = useMealSuggestion(todayMeals, calorieGoal);
  const [addingSuggestionId, setAddingSuggestionId] = React.useState<number | null>(null);

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

  // Luôn làm mới dữ liệu khi người dùng chuyển tab quay lại Trang Chủ
  useFocusEffect(
    useCallback(() => {
      fetchDailyData();
    }, [fetchDailyData])
  );

  const handleDeleteMeal = (mealId: number, dishName: string) => {
    Alert.alert(
      'Xóa món ăn',
      `Bạn có chắc chắn muốn xóa "${dishName}" khỏi nhật ký hôm nay không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMeal(mealId);
            if (result.success) {
              dispatch(removeMealItem(mealId));
            } else {
              Alert.alert('Không thể xóa món ăn', result.error?.message || 'Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const greetingName = profile?.full_name?.trim().split(/\s+/).slice(-1)[0];

  const handleAddSuggestedMeal = async (food: MealSuggestion) => {
    if (!userId) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để thêm món vào nhật ký.');
      return;
    }
    try {
      setAddingSuggestionId(food.id);
      const hour = new Date().getHours();
      const mealTime = hour < 10 ? 'Sáng' : hour < 14 ? 'Trưa' : hour < 17 ? 'Ăn vặt' : 'Tối';
      const { data, error: addError } = await addMeal(userId, food.id, 1, mealTime, today);
      if (addError || !data) {
        Alert.alert('Không thể thêm món', addError?.message || 'Vui lòng thử lại.');
        return;
      }
      dispatch(addMealItem(data));
      Alert.alert('Đã thêm món', `${food.name} đã được thêm vào ${mealTime.toLowerCase()}.`);
      await fetchDailyData();
    } catch (addError) {
      Alert.alert('Không thể thêm món', addError instanceof Error ? addError.message : 'Vui lòng thử lại.');
    } finally {
      setAddingSuggestionId(null);
    }
  };

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom + 76, 36),
        paddingHorizontal: 0,
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack width="100%" maxWidth={900} alignSelf="center" paddingHorizontal={width < 360 ? 12 : 16} gap="$4">
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
              <AppIcon name="flame-outline" size={20} color={THEME.colors.primaryDark} />
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
            <AppIcon name="person-outline" size={17} color="#FFFFFF" />
          </Button>
        </XStack>

        {/* <XStack
          backgroundColor={THEME.colors.card}
          borderRadius={24}
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack gap="$1">
            <XStack alignItems="center" gap="$1"><AppIcon name="location-outline" size={14} color={THEME.colors.textMuted} /><Text fontSize={12} color={THEME.colors.textMuted}>Thành phố Hồ Chí Minh</Text></XStack>
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
            <AppIcon name="calendar-outline" size={19} color={THEME.colors.primaryDark} />
          </View>
        </XStack> */}

        <MacroRing
          calories={totalCalories}
          calorieGoal={calorieGoal}
          carbs={totalCarbs}
          protein={totalProtein}
          fat={totalFat}
        />

        <MealSuggestionList
          suggestions={mealSuggestion.suggestions}
          summary={mealSuggestion.summary}
          loading={mealSuggestion.loading}
          error={mealSuggestion.error}
          empty={mealSuggestion.empty}
          onGenerate={mealSuggestion.generate}
          onAdd={handleAddSuggestedMeal}
          addingId={addingSuggestionId}
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
            <AppIcon name="restaurant-outline" size={34} color={THEME.colors.textMuted} />
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Chưa có bữa ăn hôm nay
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} textAlign="center">
              Thêm món ăn để theo dõi lượng calo và dinh dưỡng.
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2">
            {todayMeals.map((meal: DailyMeal) => {
              const dishName = meal.foods?.name || meal.dish_name || 'Món ăn';
              const servingText = meal.foods?.serving_size || meal.serving_size || meal.meal_time;
              const caloriesValue = Math.round(
                Number(meal.foods?.calories || meal.calories || 0) * Number(meal.quantity || 1)
              );
              const imageUrl = meal.foods?.image_url || meal.image_url;

              return (
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
                    overflow="hidden"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={{ width: '100%', height: '100%', borderRadius: 15 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <AppIcon name="restaurant-outline" size={25} color={THEME.colors.primaryDark} />
                    )}
                  </View>
                  <YStack flex={1} gap="$1">
                    <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain} numberOfLines={1}>
                      {dishName}
                    </Text>
                    <Text fontSize={12} color={THEME.colors.textMuted}>
                      {meal.quantity} khẩu phần · {servingText}
                    </Text>
                    <Text fontSize={12} color={THEME.colors.calories} fontWeight="700">
                      {caloriesValue} kcal
                    </Text>
                  </YStack>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDeleteMeal(meal.id, dishName)}
                  >
                    <View
                      width={36}
                      height={36}
                      borderRadius={18}
                      backgroundColor="#FEE2E2"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <AppIcon name="trash-outline" size={16} color="#EF4444" />
                    </View>
                  </TouchableOpacity>
                </XStack>
              );
            })}
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
          <AppIcon name="checkmark" size={18} color="#FFFFFF" />
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
