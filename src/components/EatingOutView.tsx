import React, { useState, useMemo, useEffect } from 'react';
import {
  YStack,
  XStack,
  Text,
  Input,
  ScrollView,
  View,
  Spinner,
} from 'tamagui';
import { TouchableOpacity, Image } from 'react-native';
import { THEME } from '../constants/theme';
import {
  RestaurantDish,
} from '../data/vietnameseFoodData';
import { searchRestaurantDishes } from '../services/foodService';
import { calculateEatingOutTotal } from '../services/nutritionAIService';

interface EatingOutViewProps {
  onSaveMeal: (mealData: {
    dishName: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    details: string;
  }) => Promise<void> | void;
  isSaving?: boolean;
}

export const EatingOutView: React.FC<EatingOutViewProps> = ({ onSaveMeal, isSaving = false }) => {
  const [dishesList, setDishesList] = useState<RestaurantDish[]>([]);
  const [selectedDish, setSelectedDish] = useState<RestaurantDish | null>(null);
  const [portionType, setPortionType] = useState<'standard' | 'special'>('standard');
  const [toppingQuantities, setToppingQuantities] = useState<Record<string, number>>({});
  const [manualAdjustment, setManualAdjustment] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Món ăn hiện tại
  const currentDish = selectedDish || dishesList[0] || null;

  // Truy vấn On-Demand từ Supabase Database
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await searchRestaurantDishes(searchQuery, 'all');
        if (!isCancelled) {
          setDishesList(results);
          if (results.length > 0) {
            // Nếu chưa chọn hoặc món hiện tại không nằm trong kết quả tìm kiếm mới
            if (!selectedDish || !results.some((d) => d.id === selectedDish.id)) {
              setSelectedDish(results[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi tìm kiếm món quán từ database:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Helper lấy icon theo phân loại món
  const getDishIcon = (category: string) => {
    switch (category) {
      case 'pho': return '🍜';
      case 'com': return '🍱';
      case 'bun': return '🍲';
      case 'mi_hu_tieu': return '🥣';
      case 'banh_mi': return '🥖';
      case 'xoi_khac': return '🥟';
      case 'lau_an_vat': return '🍢';
      default: return '🍽️';
    }
  };

  // Helper lấy màu nền icon topping
  const getToppingColorStyle = (colorType?: string) => {
    switch (colorType) {
      case 'peach': return { bg: '#FFEDD5', border: '#FED7AA', text: '#EA580C' };
      case 'purple': return { bg: '#EDE9FE', border: '#DDD6FE', text: '#7C3AED' };
      case 'pink': return { bg: '#FFE4E6', border: '#FECDD3', text: '#E11D48' };
      case 'mint': return { bg: '#DCFCE7', border: '#BBF7D0', text: '#16A34A' };
      case 'blue': return { bg: '#DBEAFE', border: '#BFDBFE', text: '#2563EB' };
      default: return { bg: '#F1F5F9', border: '#E2E8F0', text: '#0055D4' };
    }
  };

  // Danh sách topping đã chọn (kèm số lượng)
  const selectedToppingsList = useMemo(() => {
    if (!currentDish) return [];
    return (currentDish.toppings || [])
      .map((t) => ({ ...t, quantity: toppingQuantities[t.id] || 0 }))
      .filter((t) => t.quantity > 0);
  }, [currentDish, toppingQuantities]);

  // Tổng số lượng phần gọi thêm
  const totalToppingUnits = useMemo(() => {
    return selectedToppingsList.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedToppingsList]);

  // Tính toán Calo & Macros tổng
  const calculation = useMemo(() => {
    if (!currentDish) {
      return {
        baseCalories: 0,
        toppingsCalories: 0,
        brothCalories: 0,
        manualAdjustment: 0,
        totalCalories: 0,
        totalCarb: 0,
        totalProtein: 0,
        totalFat: 0,
        carbPercentage: 0,
        proteinPercentage: 0,
        fatPercentage: 0,
      };
    }
    return calculateEatingOutTotal(
      currentDish,
      portionType,
      toppingQuantities,
      'lean',
      manualAdjustment
    );
  }, [currentDish, portionType, toppingQuantities, manualAdjustment]);

  // Thao tác tick chọn / bỏ chọn topping
  const handleToggleTopping = (toppingId: string) => {
    setToppingQuantities((prev) => {
      const current = prev[toppingId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[toppingId];
        return next;
      }
      return { ...prev, [toppingId]: 1 };
    });
  };

  // Tăng số lượng món gọi thêm (ví dụ: 1 trứng -> 2 trứng -> 3 trứng)
  const handleIncreaseTopping = (toppingId: string) => {
    setToppingQuantities((prev) => ({
      ...prev,
      [toppingId]: (prev[toppingId] || 0) + 1,
    }));
  };

  // Giảm số lượng món gọi thêm
  const handleDecreaseTopping = (toppingId: string) => {
    setToppingQuantities((prev) => {
      const current = prev[toppingId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[toppingId];
        return next;
      }
      return {
        ...prev,
        [toppingId]: current - 1,
      };
    });
  };

  const handleSelectDish = (dish: RestaurantDish) => {
    setSelectedDish(dish);
    setPortionType('standard');
    setToppingQuantities({});
    setManualAdjustment(0);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleSave = () => {
    if (!currentDish) return;
    const portionName =
      portionType === 'standard' ? currentDish.standardPortion.label : currentDish.specialPortion.label;
    const toppingNames = selectedToppingsList
      .map((t) => `${t.name} (x${t.quantity})`)
      .join(', ');

    const details = `Quán: ${currentDish.name} (${portionName})${
      toppingNames ? ` + Topping: ${toppingNames}` : ''
    }`;

    onSaveMeal({
      dishName: `${currentDish.name} (${portionName})`,
      totalCalories: calculation.totalCalories,
      protein: calculation.totalProtein,
      carbs: calculation.totalCarb,
      fat: calculation.totalFat,
      servingSize: portionName,
      details,
    });
  };

  return (
    <YStack gap="$5">
      {/* 1. KHUNG TÌM KIẾM MÓN ĂN QUÁN VIỆT - THIẾT KẾ THOÁNG & TỐI GIẢN */}
      <YStack gap="$2.5">
        <XStack
          alignItems="center"
          backgroundColor="#FFFFFF"
          borderRadius={18}
          borderWidth={1.5}
          borderColor={isSearchFocused ? '#0055D4' : '#E2E8F0'}
          paddingHorizontal="$4"
          height={52}
          style={THEME.shadow}
        >
          <Text fontSize={18} marginRight="$3" color="#64748B">
            🔍
          </Text>
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            fontSize={15}
            fontWeight="600"
            color="#0F172A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Tìm kiếm món quán (Phở, Cơm tấm, Bún chả...)"
            placeholderTextColor="#94A3B8"
            height={50}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <View
                width={24}
                height={24}
                borderRadius={12}
                backgroundColor="#E2E8F0"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={12} color="#64748B" fontWeight="700">
                  ✕
                </Text>
              </View>
            </TouchableOpacity>
          ) : isSearchFocused ? (
            <TouchableOpacity onPress={() => setIsSearchFocused(false)} activeOpacity={0.7}>
              <Text fontSize={13} color="#0055D4" fontWeight="700">
                Đóng
              </Text>
            </TouchableOpacity>
          ) : null}
        </XStack>

        {/* Dropdown danh sách kết quả tìm kiếm khi tìm hoặc gõ */}
        {(isSearchFocused || searchQuery.trim().length > 0) && (
          <YStack
            backgroundColor="#FFFFFF"
            borderRadius={18}
            borderWidth={1}
            borderColor="#E2E8F0"
            maxHeight={260}
            overflow="hidden"
            style={THEME.shadow}
          >
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              {dishesList.length === 0 ? (
                <YStack padding="$4" alignItems="center">
                  <Text fontSize={13} color="#94A3B8">
                    Không tìm thấy món "{searchQuery}" trong kho quán Việt.
                  </Text>
                </YStack>
              ) : (
                dishesList.map((dish, idx) => (
                  <TouchableOpacity
                    key={dish.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDish(dish)}
                  >
                    <XStack
                      paddingVertical="$3"
                      paddingHorizontal="$4"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottomWidth={idx < dishesList.length - 1 ? 1 : 0}
                      borderColor="#F1F5F9"
                      backgroundColor={dish.id === currentDish?.id ? '#EFF6FF' : '#FFFFFF'}
                    >
                      <XStack alignItems="center" gap="$3">
                        <Text fontSize={20}>{getDishIcon(dish.category)}</Text>
                        <YStack gap="$0.5">
                          <Text fontSize={14.5} fontWeight="700" color="#0F172A">
                            {dish.name}
                          </Text>
                          <Text fontSize={12} color="#64748B">
                            {dish.region} • ~{dish.standardPortion.calories} kcal
                          </Text>
                        </YStack>
                      </XStack>
                      <Text fontSize={13} color="#0055D4" fontWeight="700">
                        {dish.id === currentDish?.id ? 'Đang chọn' : 'Chọn ›'}
                      </Text>
                    </XStack>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </YStack>
        )}
      </YStack>

      {/* 2. TRẠNG THÁI LOADING / TRỐNG / NỘI DUNG MÓN ĂN CHI TIẾT TỪ DATABASE */}
      {isLoading && !currentDish ? (
        <YStack
          backgroundColor="#FFFFFF"
          padding="$8"
          borderRadius={24}
          alignItems="center"
          gap="$3"
          borderWidth={1}
          borderColor="#E2E8F0"
          style={THEME.shadow}
        >
          <Spinner size="large" color="#0055D4" />
          <Text fontSize={14} fontWeight="600" color="#64748B">
            Đang tải dữ liệu món ăn từ database...
          </Text>
        </YStack>
      ) : !currentDish ? (
        <YStack
          backgroundColor="#FFFFFF"
          padding="$7"
          borderRadius={24}
          alignItems="center"
          gap="$3"
          borderWidth={1}
          borderColor="#E2E8F0"
          style={THEME.shadow}
        >
          <Text fontSize={42}>🍽️</Text>
          <Text fontSize={17} fontWeight="800" color="#0F172A">
            Chưa có món ăn trong database
          </Text>
          <Text fontSize={13} color="#64748B" textAlign="center" lineHeight={19}>
            Vui lòng thêm dữ liệu món ăn vào bảng foods trên Supabase hoặc gõ tìm kiếm từ khóa khác!
          </Text>
        </YStack>
      ) : (
        <>
          <YStack
            backgroundColor="#FFFFFF"
            padding="$4.5"
            borderRadius={24}
            borderWidth={1}
            borderColor="#E2E8F0"
            gap="$4.5"
            style={THEME.shadow}
          >
            {/* Hàng thông tin chính: Ảnh món ăn + Tên & Huy hiệu + Nút Tim */}
            <XStack alignItems="center" gap="$3.5">
              <View
                width={72}
                height={72}
                borderRadius={20}
                backgroundColor="#F8FAFC"
                borderWidth={1}
                borderColor="#E2E8F0"
                overflow="hidden"
                alignItems="center"
                justifyContent="center"
              >
                {currentDish.imageUrl ? (
                  <Image
                    source={{ uri: currentDish.imageUrl }}
                    style={{ width: '100%', height: '100%', borderRadius: 20 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text fontSize={36}>{getDishIcon(currentDish.category)}</Text>
                )}
              </View>

              <YStack flex={1} gap="$1">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize={18} fontWeight="900" color="#0F172A">
                    {currentDish.name}
                  </Text>
                  <View
                    backgroundColor="#FEF2F2"
                    borderWidth={1}
                    borderColor="#FECACA"
                    paddingHorizontal="$2"
                    paddingVertical="$0.5"
                    borderRadius={6}
                  >
                    <Text fontSize={11} fontWeight="800" color="#DC2626">
                      {currentDish.region}
                    </Text>
                  </View>
                </XStack>

                <Text fontSize={12.5} color="#64748B" fontWeight="500" numberOfLines={1}>
                  {currentDish.description || 'Nước dùng hầm xương bò truyền thống, gừng nướng'}
                </Text>

                <XStack alignItems="center" gap="$1.5" marginTop="$1">
                  <Text fontSize={12} color="#15803D" fontWeight="800">
                    🛡️ ✓
                  </Text>
                  <Text fontSize={11.5} color="#15803D" fontWeight="700">
                    {currentDish.sourceBadge || 'Dữ liệu Viện Dinh Dưỡng & Quán gia truyền'}
                  </Text>
                </XStack>
              </YStack>

              {/* Nút yêu thích */}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsFavorite(!isFavorite)}>
                <View
                  width={42}
                  height={42}
                  borderRadius={21}
                  backgroundColor="#F8FAFC"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={18} color={isFavorite ? '#DC2626' : '#94A3B8'}>
                    {isFavorite ? '❤️' : '🤍'}
                  </Text>
                </View>
              </TouchableOpacity>
            </XStack>

            {/* ĐƯỜNG PHÂN CÁCH NHẸ */}
            <View height={1} backgroundColor="#F1F5F9" />

            {/* SECTION: KÍCH CỠ SUẤT ĂN TẠI QUÁN */}
            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize={16}>🥣</Text>
                  <Text fontSize={14} fontWeight="800" color="#0F172A">
                    Kích cỡ suất ăn tại quán:
                  </Text>
                </XStack>
                <Text fontSize={13} fontWeight="800" color="#0055D4">
                  {portionType === 'standard' ? currentDish.standardPortion.label : currentDish.specialPortion.label}
                </Text>
              </XStack>

              <XStack gap="$3">
                {/* Suất Thường */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => setPortionType('standard')}
                >
                  <View
                    paddingVertical="$3.5"
                    paddingHorizontal="$3.5"
                    borderRadius={18}
                    borderWidth={2}
                    borderColor={portionType === 'standard' ? '#0055D4' : '#E2E8F0'}
                    backgroundColor={portionType === 'standard' ? '#0055D4' : '#F8FAFC'}
                    alignItems="center"
                    gap="$1.5"
                  >
                    <Text
                      fontSize={15}
                      fontWeight="900"
                      color={portionType === 'standard' ? '#FFFFFF' : '#0F172A'}
                    >
                      {currentDish.standardPortion.label}
                    </Text>
                    <Text
                      fontSize={12}
                      fontWeight="600"
                      color={portionType === 'standard' ? '#DBEAFE' : '#64748B'}
                    >
                      ~{currentDish.standardPortion.calories} kcal • {currentDish.standardPortion.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Tô Lớn / Đặc Biệt */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => setPortionType('special')}
                >
                  <View
                    paddingVertical="$3.5"
                    paddingHorizontal="$3.5"
                    borderRadius={18}
                    borderWidth={2}
                    borderColor={portionType === 'special' ? '#0055D4' : '#E2E8F0'}
                    backgroundColor={portionType === 'special' ? '#0055D4' : '#F8FAFC'}
                    alignItems="center"
                    gap="$1.5"
                  >
                    <Text
                      fontSize={15}
                      fontWeight="900"
                      color={portionType === 'special' ? '#FFFFFF' : '#0F172A'}
                    >
                      {currentDish.specialPortion.label}
                    </Text>
                    <Text
                      fontSize={12}
                      fontWeight="600"
                      color={portionType === 'special' ? '#DBEAFE' : '#64748B'}
                    >
                      ~{currentDish.specialPortion.calories} kcal • {currentDish.specialPortion.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              </XStack>
            </YStack>

            {/* SECTION: GỌI THÊM / TOPPING ĐẶC TRƯNG */}
            {currentDish.toppings && currentDish.toppings.length > 0 && (
              <>
                <View height={1} backgroundColor="#F1F5F9" />

                <YStack gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize={16} color="#EA580C">⊕</Text>
                      <Text fontSize={14} fontWeight="800" color="#0F172A">
                        Gọi thêm / Topping đặc trưng:
                      </Text>
                    </XStack>
                    <Text fontSize={12.5} color="#64748B" fontWeight="600">
                      {selectedToppingsList.length === 0
                        ? 'Chưa chọn'
                        : `Đã chọn ${selectedToppingsList.length} món (${totalToppingUnits} phần)`}
                    </Text>
                  </XStack>

                  <YStack gap="$2.5">
                    {currentDish.toppings.map((topping) => {
                      const qty = toppingQuantities[topping.id] || 0;
                      const isSelected = qty > 0;
                      const colorTheme = getToppingColorStyle(topping.colorType);

                      return (
                        <View
                          key={topping.id}
                          backgroundColor={isSelected ? '#F0F7FF' : '#FFFFFF'}
                          borderRadius={18}
                          borderWidth={1.5}
                          borderColor={isSelected ? '#2563EB' : '#E2E8F0'}
                          paddingVertical="$2.5"
                          paddingHorizontal="$3.5"
                        >
                          <XStack
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            {/* Bấm vào phần thông tin bên trái để tick chọn / bỏ chọn */}
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={{ flex: 1 }}
                              onPress={() => handleToggleTopping(topping.id)}
                            >
                              <XStack alignItems="center" gap="$3">
                                {/* Checkbox vuông bo tròn */}
                                <View
                                  width={22}
                                  height={22}
                                  borderRadius={7}
                                  borderWidth={1.5}
                                  borderColor={isSelected ? '#0055D4' : '#CBD5E1'}
                                  backgroundColor={isSelected ? '#0055D4' : '#FFFFFF'}
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  {isSelected && (
                                    <Text fontSize={13} fontWeight="900" color="#FFFFFF" style={{ marginTop: -2 }}>
                                      ✓
                                    </Text>
                                  )}
                                </View>

                                {/* Icon tròn màu sắc */}
                                <View
                                  width={38}
                                  height={38}
                                  borderRadius={19}
                                  backgroundColor={colorTheme.bg}
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Text fontSize={18}>{topping.icon}</Text>
                                </View>

                                {/* Tên & chi tiết dinh dưỡng */}
                                <YStack flex={1} gap="$0.5">
                                  <Text fontSize={14} fontWeight="800" color="#0F172A" numberOfLines={1}>
                                    {topping.name}
                                  </Text>
                                  <Text fontSize={11.5} color="#64748B" fontWeight="500">
                                    {topping.subtitle || `+${topping.calories} kcal/suất`}
                                  </Text>
                                </YStack>
                              </XStack>
                            </TouchableOpacity>

                            {/* Bên phải: Nếu đã chọn thì hiển thị bộ tăng/giảm khẩu phần Stepper [-] [qty] [+] */}
                            {isSelected ? (
                              <XStack alignItems="center" gap="$2.5">
                                <XStack
                                  alignItems="center"
                                  backgroundColor="#FFFFFF"
                                  borderRadius={16}
                                  borderWidth={1.2}
                                  borderColor="#BFDBFE"
                                  paddingHorizontal="$1"
                                  paddingVertical="$0.5"
                                  gap="$1"
                                >
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleDecreaseTopping(topping.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  >
                                    <View
                                      width={26}
                                      height={26}
                                      borderRadius={13}
                                      backgroundColor="#EFF6FF"
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Text fontSize={14} fontWeight="900" color="#0055D4">
                                        －
                                      </Text>
                                    </View>
                                  </TouchableOpacity>

                                  <View minWidth={22} alignItems="center" justifyContent="center">
                                    <Text fontSize={14} fontWeight="900" color="#0055D4">
                                      {qty}
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleIncreaseTopping(topping.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  >
                                    <View
                                      width={26}
                                      height={26}
                                      borderRadius={13}
                                      backgroundColor="#0055D4"
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Text fontSize={14} fontWeight="900" color="#FFFFFF">
                                        ＋
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                </XStack>

                                <YStack alignItems="flex-end" minWidth={60}>
                                  <Text fontSize={13.5} fontWeight="900" color="#0055D4">
                                    +{topping.calories * qty} kcal
                                  </Text>
                                  <Text fontSize={10} color="#64748B" fontWeight="600">
                                    ({qty} phần)
                                  </Text>
                                </YStack>
                              </XStack>
                            ) : (
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleToggleTopping(topping.id)}
                              >
                                <Text fontSize={13.5} fontWeight="800" color="#64748B">
                                  +{topping.calories} kcal
                                </Text>
                              </TouchableOpacity>
                            )}
                          </XStack>
                        </View>
                      );
                    })}
                  </YStack>
                </YStack>
              </>
            )}

            {/* ĐƯỜNG PHÂN CÁCH TRƯỚC PHẦN CALO */}
            <View height={1} backgroundColor="#F1F5F9" />

            {/* SECTION: TỔNG NĂNG LƯỢNG & MACROS */}
            <YStack
              backgroundColor="#EEF4FF"
              padding="$4.5"
              borderRadius={22}
              borderWidth={1}
              borderColor="#DBEAFE"
              gap="$3.5"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap="$1">
                  <Text fontSize={12.5} color="#475569" fontWeight="600">
                    Tổng calo ước tính cả bữa:
                  </Text>
                  <XStack alignItems="baseline" gap="$2">
                    <Text fontSize={34} fontWeight="900" color="#0055D4">
                      {calculation.totalCalories}
                    </Text>
                    <Text fontSize={16} fontWeight="900" color="#0055D4">
                      kcal
                    </Text>
                    <Text fontSize={12} color="#64748B">
                      ({calculation.baseCalories} + {calculation.toppingsCalories + calculation.brothCalories + calculation.manualAdjustment})
                    </Text>
                  </XStack>
                </YStack>

                {/* Stepper tinh chỉnh */}
                <XStack
                  alignItems="center"
                  backgroundColor="#FFFFFF"
                  borderRadius={20}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1.5"
                  gap="$1.5"
                >
                  <TouchableOpacity
                    onPress={() => setManualAdjustment((prev) => prev - 25)}
                    activeOpacity={0.6}
                  >
                    <Text fontSize={18} fontWeight="800" color="#64748B" paddingHorizontal="$2">
                      -
                    </Text>
                  </TouchableOpacity>
                  <Text fontSize={12.5} fontWeight="800" color="#0F172A">
                    Chỉnh
                  </Text>
                  <TouchableOpacity
                    onPress={() => setManualAdjustment((prev) => prev + 25)}
                    activeOpacity={0.6}
                  >
                    <Text fontSize={18} fontWeight="800" color="#64748B" paddingHorizontal="$2">
                      +
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </XStack>

              {/* Thanh phân bố tỷ lệ Macro */}
              <XStack height={8} borderRadius={4} overflow="hidden" backgroundColor="#E2E8F0">
                <View width={`${calculation.carbPercentage}%`} backgroundColor="#2563EB" />
                <View width={`${calculation.proteinPercentage}%`} backgroundColor="#059669" />
                <View width={`${calculation.fatPercentage}%`} backgroundColor="#EA580C" />
              </XStack>

              {/* 3 Thẻ Macro màu trắng bo tròn theo mockup */}
              <XStack gap="$2.5">
                <View
                  flex={1}
                  backgroundColor="#FFFFFF"
                  paddingVertical="$3"
                  paddingHorizontal="$1.5"
                  borderRadius={16}
                  alignItems="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$0.5"
                >
                  <Text fontSize={11} color="#0F172A" fontWeight="700">● Carb</Text>
                  <Text fontSize={17} fontWeight="900" color="#0F172A">{calculation.totalCarb}g</Text>
                  <Text fontSize={10.5} color="#64748B">{calculation.carbPercentage}% Calo</Text>
                </View>

                <View
                  flex={1}
                  backgroundColor="#FFFFFF"
                  paddingVertical="$3"
                  paddingHorizontal="$1.5"
                  borderRadius={16}
                  alignItems="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$0.5"
                >
                  <Text fontSize={11} color="#059669" fontWeight="700">● Đạm</Text>
                  <Text fontSize={17} fontWeight="900" color="#0F172A">{calculation.totalProtein}g</Text>
                  <Text fontSize={10.5} color="#64748B">{calculation.proteinPercentage}% Calo</Text>
                </View>

                <View
                  flex={1}
                  backgroundColor="#FFFFFF"
                  paddingVertical="$3"
                  paddingHorizontal="$1.5"
                  borderRadius={16}
                  alignItems="center"
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$0.5"
                >
                  <Text fontSize={11} color="#EA580C" fontWeight="700">● Béo</Text>
                  <Text fontSize={17} fontWeight="900" color="#0F172A">{calculation.totalFat}g</Text>
                  <Text fontSize={10.5} color="#64748B">{calculation.fatPercentage}% Calo</Text>
                </View>
              </XStack>
            </YStack>
          </YStack>

          {/* 3. THANH THAO TÁC DƯỚI CÙNG (BOOKMARK + LƯU BỮA ĂN NGOÀI) */}
          <XStack gap="$3.5" alignItems="center" marginTop="$2" marginBottom="$4">
            <TouchableOpacity activeOpacity={0.75}>
              <View
                width={54}
                height={54}
                borderRadius={27}
                backgroundColor="#FFFFFF"
                borderWidth={1.5}
                borderColor="#E2E8F0"
                alignItems="center"
                justifyContent="center"
                style={THEME.shadow}
              >
                <Text fontSize={22} color="#0F172A">
                  🔖
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isSaving}
            >
              <View
                height={54}
                borderRadius={27}
                backgroundColor="#0055D4"
                alignItems="center"
                justifyContent="center"
                style={THEME.shadow}
              >
                <XStack alignItems="center" gap="$2">
                  <Text fontSize={17} color="#FFFFFF">
                    ⚡
                  </Text>
                  <Text color="#FFFFFF" fontSize={15.5} fontWeight="800">
                    {isSaving ? 'Đang lưu...' : `Lưu bữa ăn ngoài (~${calculation.totalCalories} kcal)`}
                  </Text>
                </XStack>
              </View>
            </TouchableOpacity>
          </XStack>
        </>
      )}
    </YStack>
  );
};
