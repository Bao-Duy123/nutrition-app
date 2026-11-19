import React, { useState } from 'react';
import { YStack, XStack, Text, ScrollView, View } from 'tamagui';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { addMealItem } from '../../src/store/slices/dietSlice';
import { logCalculatedMeal } from '../../src/services/supabase';
import { THEME } from '../../src/constants/theme';
import { MealTimeType } from '../../src/types/database';
import { EatingOutView } from '../../src/components/EatingOutView';
import { HomeCookingView } from '../../src/components/HomeCookingView';
import { useAppModal } from '../../src/components/ModalProvider';

export default function DiaryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const { userId } = useAppSelector((state) => state.auth);

  // Tab chuyển đổi: 'eating_out' (Ăn ngoài) vs 'home_cooking' (Tự nấu)
  const [activeTab, setActiveTab] = useState<'eating_out' | 'home_cooking'>('eating_out');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Xác định buổi ăn tự động theo thời điểm trong ngày
  const getDefaultMealTime = (): MealTimeType => {
    const hour = new Date().getHours();
    if (hour < 10) return 'Sáng';
    if (hour < 14) return 'Trưa';
    if (hour < 17) return 'Ăn vặt';
    return 'Tối';
  };

  // Xử lý lưu bữa ăn đã qua tính toán
  const handleSaveMeal = async (mealData: {
    dishName: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    details: string;
  }): Promise<boolean> => {
    try {
      setIsSaving(true);
      const mealTime = getDefaultMealTime();
      const targetDate = new Date().toISOString().split('T')[0];

      if (!userId) {
        // Fallback lưu trực tiếp vào Redux khi chưa đăng nhập / chế độ khách
        const localMeal = {
          id: Date.now(),
          user_id: 'guest',
          food_id: 0,
          quantity: 1,
          meal_time: mealTime,
          consumed_date: targetDate,
          created_at: new Date().toISOString(),
          dish_name: mealData.dishName,
          serving_size: mealData.servingSize,
          calories: mealData.totalCalories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
        };
        dispatch(addMealItem(localMeal as any));
        await modal.alert({
          title: 'Đã lưu bữa ăn! 🎉',
          message: `Đã ghi nhận ${mealData.dishName} (~${mealData.totalCalories} kcal) vào nhật ký.`,
          type: 'success',
          confirmText: 'Tuyệt vời',
        });
        return true;
      }

      const { data, error } = await logCalculatedMeal(userId, {
        dishName: mealData.dishName,
        totalCalories: mealData.totalCalories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        servingSize: mealData.servingSize,
        mealTime,
      });

      if (error) {
        console.warn('Lỗi Supabase khi lưu meal, fallback Redux:', error);
        const fallbackMeal = {
          id: Date.now(),
          user_id: userId,
          food_id: 0,
          quantity: 1,
          meal_time: mealTime,
          consumed_date: targetDate,
          created_at: new Date().toISOString(),
          dish_name: mealData.dishName,
          serving_size: mealData.servingSize,
          calories: mealData.totalCalories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
        };
        dispatch(addMealItem(fallbackMeal as any));
        await modal.alert({
          title: 'Đã lưu bữa ăn! 🎉',
          message: `Đã ghi nhận ${mealData.dishName} (~${mealData.totalCalories} kcal) vào nhật ký.`,
          type: 'success',
          confirmText: 'Tuyệt vời',
        });
        return true;
      } else if (data) {
        dispatch(addMealItem(data));
        await modal.alert({
          title: 'Đã lưu bữa ăn! 🎉',
          message: `Đã ghi nhận ${mealData.dishName} (~${mealData.totalCalories} kcal) vào nhật ký hôm nay.`,
          type: 'success',
          confirmText: 'Tuyệt vời',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      await modal.alert({
        title: 'Lỗi ngoại lệ',
        message: err?.message || 'Đã có lỗi xảy ra.',
        type: 'error',
        confirmText: 'Đóng',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const isEatingOut = activeTab === 'eating_out';

  return (
    <ScrollView
      backgroundColor="#F8FAFC"
      contentContainerStyle={{ paddingBottom: 90 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack paddingHorizontal="$4.5" paddingTop="$4.5" gap="$4.5">
        {/* ROW 1: HEADER TRANG */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3" flex={1}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.push('/(tabs)');
              }}
            >
              <View
                width={40}
                height={40}
                borderRadius={20}
                backgroundColor="#FFFFFF"
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor="#E2E8F0"
                style={THEME.shadow}
              >
                <Text fontSize={22} color="#0F172A" fontWeight="700" style={{ marginTop: -2 }}>
                  ‹
                </Text>
              </View>
            </TouchableOpacity>

            <YStack flex={1}>
              <Text fontSize={20} fontWeight="900" color="#0F172A" numberOfLines={1}>
                {isEatingOut ? 'Ăn ngoài' : 'Tự nấu'}
              </Text>
            </YStack>
          </XStack>
        </XStack>

        {/* ROW 2: BỘ CHUYỂN ĐỔI TAB: [🍽️ Ăn ngoài] vs [🍳 Tự nấu] */}
        <XStack
          backgroundColor="#E2E8F0"
          padding="$1.5"
          borderRadius={24}
          gap="$1.5"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => setActiveTab('eating_out')}
          >
            <View
              height={44}
              borderRadius={22}
              backgroundColor={isEatingOut ? '#FFFFFF' : 'transparent'}
              alignItems="center"
              justifyContent="center"
              style={isEatingOut ? THEME.shadow : undefined}
            >
              <Text
                fontSize={14}
                fontWeight={isEatingOut ? '800' : '600'}
                color={isEatingOut ? '#0055D4' : '#64748B'}
              >
                🍽️ Ăn ngoài
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => setActiveTab('home_cooking')}
          >
            <View
              height={44}
              borderRadius={22}
              backgroundColor={!isEatingOut ? '#FFFFFF' : 'transparent'}
              alignItems="center"
              justifyContent="center"
              style={!isEatingOut ? THEME.shadow : undefined}
            >
              <Text
                fontSize={14}
                fontWeight={!isEatingOut ? '800' : '600'}
                color={!isEatingOut ? '#0055D4' : '#64748B'}
              >
                🍳 Tự nấu
              </Text>
            </View>
          </TouchableOpacity>
        </XStack>

        {/* ROW 3: NỘI DUNG VIEW THEO TAB ĐƯỢC CHỌN */}
        {isEatingOut ? (
          <EatingOutView onSaveMeal={handleSaveMeal} isSaving={isSaving} />
        ) : (
          <HomeCookingView onSaveMeal={handleSaveMeal} isSaving={isSaving} />
        )}
      </YStack>
    </ScrollView>
  );
}
