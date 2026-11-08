import React, { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Input, ScrollView, Spinner, Button } from 'tamagui';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { addMealItem, setFoods } from '../../src/store/slices/dietSlice';
import { getAllFoods, addMeal, getTodayDateString } from '../../src/services/supabase';
import { useDebounce } from '../../src/hooks/useDebounce';
import { FoodCard } from '../../src/components/FoodCard';
import { THEME } from '../../src/constants/theme';
import { Food, MealTimeType } from '../../src/types/database';

export default function DiaryScreen() {
  const dispatch = useAppDispatch();
  const { userId } = useAppSelector((state) => state.auth);
  const { foods } = useAppSelector((state) => state.diet);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>('Trưa');
  const [loading, setLoading] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<number | null>(null);

  const mealOptions: MealTimeType[] = ['Sáng', 'Trưa', 'Tối', 'Ăn vặt'];

  // Fetch danh sách thực phẩm từ Supabase
  const fetchFoods = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const { data, error } = await getAllFoods(query);
      if (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách thực phẩm: ' + error.message);
      } else {
        dispatch(setFoods(data));
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch foods:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchFoods(debouncedSearch);
  }, [debouncedSearch, fetchFoods]);

  // Xử lý thêm món ăn vào bảng daily_meals
  const handleAddMeal = async (food: Food, quantity: number) => {
    if (!userId) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu bữa ăn của bạn!');
      return;
    }

    try {
      setAddingFoodId(food.id);
      const todayStr = getTodayDateString();

      const { data, error } = await addMeal(
        userId,
        food.id,
        quantity,
        selectedMealTime,
        todayStr
      );

      if (error) {
        Alert.alert('Lỗi thêm món', error.message || 'Không thể lưu vào database');
      } else if (data) {
        dispatch(addMealItem(data));
        Alert.alert(
          'Đã thêm!',
          `Đã thêm ${quantity} khẩu phần ${food.name} vào bữa ${selectedMealTime}.`
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi ngoại lệ', err.message || 'Đã xảy ra sự cố');
    } finally {
      setAddingFoodId(null);
    }
  };

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack padding="$4" gap="$4">
        {/* TIÊU ĐỀ */}
        <YStack gap="$1">
          <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain}>
            Nhật Ký Thực Phẩm 📖
          </Text>
          <Text fontSize={13} color={THEME.colors.textMuted}>
            Tìm kiếm món ăn và thêm vào thực đơn hàng ngày của bạn
          </Text>
        </YStack>

        {/* CHỌN BUỔI ĂN */}
        <YStack gap="$2">
          <Text fontSize={13} fontWeight="600" color={THEME.colors.textMain}>
            Thêm vào bữa:
          </Text>
          <XStack gap="$2">
            {mealOptions.map((time) => {
              const isSelected = selectedMealTime === time;
              return (
                <Button
                  key={time}
                  flex={1}
                  height={40}
                  backgroundColor={isSelected ? THEME.colors.primary : THEME.colors.card}
                  borderWidth={1}
                  borderColor={isSelected ? THEME.colors.primary : THEME.colors.border}
                  borderRadius={THEME.radius.md}
                  onPress={() => setSelectedMealTime(time)}
                >
                  <Text
                    fontSize={13}
                    fontWeight={isSelected ? '700' : '500'}
                    color={isSelected ? '#FFFFFF' : THEME.colors.textMain}
                  >
                    {time}
                  </Text>
                </Button>
              );
            })}
          </XStack>
        </YStack>

        {/* THANH TÌM KIẾM THỰC PHẨM */}
        <YStack gap="$1">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="🔍 Tìm món ăn (vd: Cơm tấm, Ức gà, Phở...)"
            backgroundColor={THEME.colors.card}
            borderColor={THEME.colors.border}
            borderRadius={THEME.radius.md}
            paddingHorizontal="$4"
            height={48}
            fontSize={14}
          />
        </YStack>

        {/* DANH SÁCH MÓN ĂN TỪ SUPABASE */}
        <YStack gap="$3" marginTop="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Danh sách thực phẩm ({foods.length})
            </Text>
            {loading && <Spinner size="small" color={THEME.colors.primary} />}
          </XStack>

          {loading && foods.length === 0 ? (
            <YStack padding="$6" alignItems="center" gap="$2">
              <Spinner size="large" color={THEME.colors.primary} />
              <Text fontSize={13} color={THEME.colors.textMuted}>
                Đang tìm kiếm thực phẩm từ cơ sở dữ liệu...
              </Text>
            </YStack>
          ) : foods.length === 0 ? (
            <YStack
              backgroundColor={THEME.colors.card}
              padding="$6"
              borderRadius={THEME.radius.lg}
              alignItems="center"
              borderWidth={1}
              borderColor={THEME.colors.border}
              gap="$2"
            >
              <Text fontSize={36}>🔍</Text>
              <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
                Không tìm thấy món ăn phù hợp
              </Text>
              <Text fontSize={13} color={THEME.colors.textMuted} textAlign="center">
                Hãy thử tìm kiếm với từ khóa khác như "trứng", "bò", "chuối"...
              </Text>
            </YStack>
          ) : (
            <YStack gap="$3">
              {foods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onAddMeal={handleAddMeal}
                  isLoading={addingFoodId === food.id}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
