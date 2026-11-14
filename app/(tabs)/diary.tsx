import React, { useState } from 'react';
import { YStack, XStack, Text, ScrollView, View } from 'tamagui';
import { TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { addMealItem } from '../../src/store/slices/dietSlice';
import { logCalculatedMeal } from '../../src/services/supabase';
import { THEME } from '../../src/constants/theme';
import { MealTimeType } from '../../src/types/database';
import { EatingOutView } from '../../src/components/EatingOutView';
import { HomeCookingView } from '../../src/components/HomeCookingView';

export default function DiaryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userId } = useAppSelector((state) => state.auth);

  // Tab chuyển đổi: 'eating_out' (Ăn ngoài) vs 'home_cooking' (Tự nấu)
  const [activeTab, setActiveTab] = useState<'eating_out' | 'home_cooking'>('eating_out');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>('Trưa');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const mealOptions: MealTimeType[] = ['Sáng', 'Trưa', 'Tối', 'Ăn vặt'];

  // Xử lý lưu bữa ăn đã qua tính toán
  const handleSaveMeal = async (mealData: {
    dishName: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    details: string;
  }) => {
    if (!userId) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập tài khoản để lưu bữa ăn vào nhật ký.');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error } = await logCalculatedMeal(userId, {
        dishName: mealData.dishName,
        totalCalories: mealData.totalCalories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        servingSize: mealData.servingSize,
        mealTime: selectedMealTime,
      });

      if (error) {
        Alert.alert('Không thể lưu', error.message || 'Lỗi khi lưu vào cơ sở dữ liệu.');
      } else if (data) {
        dispatch(addMealItem(data));
        Alert.alert(
          'Đã lưu bữa ăn! 🎉',
          `Đã ghi nhận ${mealData.dishName} (${mealData.totalCalories} kcal) vào bữa ${selectedMealTime} hôm nay.`,
          [
            {
              text: 'Về Trang chủ',
              onPress: () => router.push('/(tabs)'),
            },
            {
              text: 'Ở lại',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi ngoại lệ', err?.message || 'Đã có lỗi xảy ra.');
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
        {/* ROW 1: HEADER TRANG - CHUẨN XÁC THEO MOCKUP */}
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
              <Text fontSize={19} fontWeight="900" color="#0F172A" numberOfLines={1}>
                {isEatingOut ? 'Ăn ngoài & Tiệm quán' : 'Tự nấu & Cân tiểu ly'}
              </Text>
              {isEatingOut ? (
                <Text fontSize={12.5} color="#64748B" fontWeight="500">
                  Tùy biến món quán Việt
                </Text>
              ) : (
                <XStack alignItems="center" gap="$1.5">
                  <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
                  <Text fontSize={12} color="#64748B" fontWeight="500" numberOfLines={1}>
                    Kiểm soát macro từng gram nguyên liệu thực tế
                  </Text>
                </XStack>
              )}
            </YStack>
          </XStack>

          {/* Phía bên phải của Header: Kho dữ liệu hoặc Chuẩn 99% gram + Nút 3 chấm */}
          <XStack alignItems="center" gap="$2.5">
            {isEatingOut ? (
              <TouchableOpacity activeOpacity={0.8}>
                <View
                  backgroundColor="#EEF2FF"
                  borderWidth={1}
                  borderColor="#E0E7FF"
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  borderRadius={18}
                >
                  <XStack alignItems="center" gap="$1.5">
                    <Text fontSize={13}>🗂️</Text>
                    <Text fontSize={12} fontWeight="700" color="#4F46E5">
                      Kho dữ liệu món Việt
                    </Text>
                  </XStack>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                backgroundColor="#ECFDF5"
                borderWidth={1}
                borderColor="#D1FAE5"
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                borderRadius={18}
              >
                <Text fontSize={12} fontWeight="800" color="#059669">
                  Chuẩn 99% gram
                </Text>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.7}>
              <View
                width={36}
                height={36}
                borderRadius={18}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={20} color="#64748B" fontWeight="900">
                  ⋮
                </Text>
              </View>
            </TouchableOpacity>
          </XStack>
        </XStack>

        {/* ROW 2: BỘ CHUYỂN ĐỔI TAB: [🍽️ Ăn ngoài quán] vs [🍳 Tự nấu mâm ăn] */}
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
                fontSize={13.5}
                fontWeight={isEatingOut ? '800' : '600'}
                color={isEatingOut ? '#0055D4' : '#64748B'}
              >
                🍽️ Ăn ngoài quán
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
                fontSize={13.5}
                fontWeight={!isEatingOut ? '800' : '600'}
                color={!isEatingOut ? '#0055D4' : '#64748B'}
              >
                🍳 Tự nấu mâm ăn
              </Text>
            </View>
          </TouchableOpacity>
        </XStack>

        {/* ROW 3: CHỌN BUỔI ĂN - THOẢI MÁI, GỌN GÀNG */}
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$1" marginVertical="$0.5">
          <Text fontSize={13.5} fontWeight="700" color="#475569">
            Buổi ăn hôm nay:
          </Text>
          <XStack gap="$2">
            {mealOptions.map((time) => {
              const isSelected = selectedMealTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMealTime(time)}
                >
                  <View
                    paddingHorizontal="$3.5"
                    paddingVertical="$2"
                    borderRadius={18}
                    backgroundColor={isSelected ? '#0055D4' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor={isSelected ? '#0055D4' : '#E2E8F0'}
                  >
                    <Text
                      fontSize={12.5}
                      fontWeight={isSelected ? '800' : '600'}
                      color={isSelected ? '#FFFFFF' : '#64748B'}
                    >
                      {time}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </XStack>
        </XStack>

        {/* ROW 4: NỘI DUNG VIEW THEO TAB ĐƯỢC CHỌN */}
        {isEatingOut ? (
          <EatingOutView onSaveMeal={handleSaveMeal} isSaving={isSaving} />
        ) : (
          <HomeCookingView onSaveMeal={handleSaveMeal} isSaving={isSaving} />
        )}
      </YStack>
    </ScrollView>
  );
}
