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
import { TouchableOpacity, Alert, Image } from 'react-native';
import { THEME } from '../constants/theme';
import {
  RawIngredient,
} from '../data/vietnameseFoodData';
import { searchRawIngredients } from '../services/foodService';
import {
  calculateIngredientCookingExtras,
} from '../services/nutritionAIService';
import { useAppSelector } from '../store';

export interface CookingPlateItem {
  id: string;
  ingredient: RawIngredient;
  grams: number;
  cookingMethodId: string;
}

interface HomeCookingViewProps {
  onSaveMeal: (mealData: {
    dishName: string;
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    details: string;
  }) => Promise<boolean | void> | boolean | void;
  isSaving?: boolean;
}

const AVAILABLE_METHODS = [
  { id: 'boil_steam', name: 'Luộc / Hấp', icon: '💧' },
  { id: 'stir_fry', name: 'Áp chảo / Xào', icon: '🍳' },
  { id: 'deep_fry', name: 'Chiên / Rán', icon: '🍟' },
  { id: 'grilled', name: 'Nướng', icon: '🔥' },
  { id: 'braised', name: 'Kho / Rim', icon: '🍲' },
  { id: 'none', name: 'Ăn tươi / Sống', icon: '🥗' },
];

export const HomeCookingView: React.FC<HomeCookingViewProps> = ({ onSaveMeal, isSaving = false }) => {
  const { userId } = useAppSelector((state) => state.auth);

  const [ingredientsList, setIngredientsList] = useState<RawIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<RawIngredient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inputGrams, setInputGrams] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mâm ăn chứa các nguyên liệu và cách chế biến riêng của từng nguyên liệu
  const [plateItems, setPlateItems] = useState<CookingPlateItem[]>([]);

  // Nguyên liệu đang chọn để chuẩn bị thêm vào mâm
  const currentIngredient = selectedIngredient || ingredientsList[0] || null;

  // Truy vấn On-Demand từ Supabase Database
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await searchRawIngredients(searchQuery, selectedCategory);
        if (!isCancelled) {
          setIngredientsList(results);
          if (results.length > 0) {
            if (!selectedIngredient || !results.some((i) => i.id === selectedIngredient.id)) {
              setSelectedIngredient(results[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi tìm kiếm nguyên liệu từ database:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Tính toán toàn bộ dinh dưỡng & calo mâm cơm (gộp từng nguyên liệu theo cách chế biến của nó)
  const plateTotals = useMemo(() => {
    let totalWeight = 0;
    let baseCalories = 0;
    let baseProtein = 0;
    let baseCarbs = 0;
    let baseFat = 0;

    let totalExtraCalories = 0;
    let totalExtraFat = 0;
    let totalExtraCarb = 0;
    let totalExtraProtein = 0;
    let totalOilGrams = 0;

    const itemDetails = plateItems.map((item) => {
      const factor = item.grams / 100;
      const bCal = Math.round(item.ingredient.caloriesPer100g * factor);
      const bP = Number((item.ingredient.proteinPer100g * factor).toFixed(1));
      const bC = Number((item.ingredient.carbsPer100g * factor).toFixed(1));
      const bF = Number((item.ingredient.fatPer100g * factor).toFixed(1));

      const extras = calculateIngredientCookingExtras(item.cookingMethodId, item.grams);

      totalWeight += item.grams;
      baseCalories += bCal;
      baseProtein += bP;
      baseCarbs += bC;
      baseFat += bF;

      totalExtraCalories += extras.extraCalories;
      totalExtraFat += extras.extraFat;
      totalExtraCarb += extras.extraCarb;
      totalExtraProtein += extras.extraProtein;
      totalOilGrams += extras.oilGrams;

      return {
        ...item,
        bCal,
        bP,
        bC,
        bF,
        extras,
        totalItemCalories: bCal + extras.extraCalories,
        totalItemProtein: Number((bP + extras.extraProtein).toFixed(1)),
        totalItemCarbs: Number((bC + extras.extraCarb).toFixed(1)),
        totalItemFat: Number((bF + extras.extraFat).toFixed(1)),
      };
    });

    const totalCalories = Math.round(baseCalories + totalExtraCalories);
    const totalProtein = Number((baseProtein + totalExtraProtein).toFixed(1));
    const totalCarbs = Number((baseCarbs + totalExtraCarb).toFixed(1));
    const totalFat = Number((baseFat + totalExtraFat).toFixed(1));

    const carbCal = totalCarbs * 4;
    const proteinCal = totalProtein * 4;
    const fatCal = totalFat * 9;
    const sumCal = carbCal + proteinCal + fatCal || 1;

    const carbPercentage = Math.round((carbCal / sumCal) * 100);
    const proteinPercentage = Math.round((proteinCal / sumCal) * 100);
    const fatPercentage = Math.max(0, 100 - carbPercentage - proteinPercentage);

    return {
      totalWeight: Math.round(totalWeight),
      baseCalories: Math.round(baseCalories),
      totalExtraCalories: Math.round(totalExtraCalories),
      totalOilGrams: Number(totalOilGrams.toFixed(1)),
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      carbPercentage,
      proteinPercentage,
      fatPercentage,
      itemDetails,
    };
  }, [plateItems]);

  // Thêm nguyên liệu vào mâm (mặc định cách nấu thanh đạm, chọn cách nấu trực tiếp trên thẻ món)
  const handleAddIngredient = () => {
    if (!currentIngredient) {
      Alert.alert('Chưa chọn thực phẩm', 'Vui lòng chọn một nguyên liệu từ danh sách database.');
      return;
    }
    if (inputGrams <= 0) {
      Alert.alert('Khối lượng không hợp lệ', 'Vui lòng nhập số gram lớn hơn 0.');
      return;
    }

    const newItem: CookingPlateItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ingredient: currentIngredient,
      grams: inputGrams,
      cookingMethodId: 'boil_steam',
    };

    setPlateItems((prev) => [...prev, newItem]);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Đổi cách chế biến trực tiếp của một món trong mâm
  const handleChangeItemMethod = (id: string, methodId: string) => {
    setPlateItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, cookingMethodId: methodId } : it))
    );
  };

  // Tăng/giảm khối lượng gram của một món trong mâm
  const handleAdjustItemGrams = (id: string, delta: number) => {
    setPlateItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newGrams = Math.max(10, it.grams + delta);
        return { ...it, grams: newGrams };
      })
    );
  };

  // Nhập gram trực tiếp cho một món
  const handleEditItemGrams = (id: string) => {
    Alert.prompt
      ? Alert.prompt(
          'Đổi khối lượng cân',
          'Nhập số gram mới cho nguyên liệu này:',
          (text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val) && val > 0) {
              setPlateItems((prev) =>
                prev.map((it) => (it.id === id ? { ...it, grams: val } : it))
              );
            }
          },
          'plain-text',
          '100'
        )
      : handleAdjustItemGrams(id, 50);
  };

  // Xóa nguyên liệu khỏi mâm
  const handleRemoveItem = (id: string) => {
    setPlateItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Lưu bữa tự nấu vào nhật ký & DB
  const handleSave = async () => {
    if (plateItems.length === 0) {
      return;
    }

    const dishTitle = plateItems.length > 1 ? `Bữa cơm tự nấu (${plateItems.length} món)` : 'Bữa ăn tự nấu';
    const ingredientDetails = plateTotals.itemDetails
      .map(
        (i) =>
          `${i.ingredient.name} (${i.grams}g - ${i.extras.cookingMethodName}${
            i.extras.extraCalories > 0 ? ` +${i.extras.extraCalories} kcal dầu/sốt` : ''
          })`
      )
      .join(', ');

    const details = `Tự nấu: ${dishTitle}. Khối lượng: ${plateTotals.totalWeight}g. Nguyên liệu: ${ingredientDetails}. Dầu mỡ & gia vị: +${plateTotals.totalExtraCalories} kcal (~${plateTotals.totalOilGrams}g dầu).`;

    const result = await onSaveMeal({
      dishName: dishTitle,
      totalCalories: plateTotals.totalCalories,
      protein: plateTotals.totalProtein,
      carbs: plateTotals.totalCarbs,
      fat: plateTotals.totalFat,
      servingSize: `${plateTotals.totalWeight}g mâm ăn`,
      details,
    });

    if (result !== false) {
      setPlateItems([]);
      setInputGrams(100);
      setSearchQuery('');
    }
  };

  return (
    <YStack gap="$5">
      {/* ========================================================================= */}
      {/* 1. SECTION: CHỌN VÀ CÂN NGUYÊN LIỆU (GỌN GÀNG, THOÁNG MẮT) */}
      {/* ========================================================================= */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={24}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$4"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16.5} fontWeight="800" color="#0F172A">
            1. Thêm nguyên liệu vào mâm
          </Text>
          <View
            backgroundColor="#EEF2FF"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={16}
          >
            <Text fontSize={12} fontWeight="700" color="#4F46E5">
              Cân thực phẩm (gam)
            </Text>
          </View>
        </XStack>

        {/* Ô tìm kiếm nguyên liệu */}
        <XStack
          alignItems="center"
          backgroundColor="#F8FAFC"
          borderRadius={16}
          borderWidth={1.5}
          borderColor={isSearchFocused ? '#0055D4' : '#E2E8F0'}
          paddingHorizontal="$4"
          height={50}
        >
          <Text fontSize={17} marginRight="$3" color="#64748B">
            🔍
          </Text>
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            fontSize={14.5}
            fontWeight="600"
            color="#0F172A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Tìm thịt, cá, rau, trứng, cơm..."
            placeholderTextColor="#94A3B8"
            height={48}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <View
                width={24}
                height={24}
                borderRadius={12}
                backgroundColor="#E2E8F0"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={11.5} color="#64748B" fontWeight="700">
                  ✕
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </XStack>

        {/* Dropdown danh sách kết quả tìm kiếm */}
        {(isSearchFocused || searchQuery.trim().length > 0) && (
          <YStack
            backgroundColor="#FFFFFF"
            borderRadius={16}
            borderWidth={1}
            borderColor="#E2E8F0"
            maxHeight={230}
            overflow="hidden"
            style={THEME.shadow}
          >
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              {ingredientsList.length === 0 ? (
                <YStack padding="$4" alignItems="center">
                  <Text fontSize={13} color="#94A3B8">
                    Không tìm thấy "{searchQuery}".
                  </Text>
                </YStack>
              ) : (
                ingredientsList.map((ing, idx) => (
                  <TouchableOpacity
                    key={ing.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedIngredient(ing);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                  >
                    <XStack
                      paddingVertical="$3"
                      paddingHorizontal="$4"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottomWidth={idx < ingredientsList.length - 1 ? 1 : 0}
                      borderColor="#F1F5F9"
                      backgroundColor={ing.id === currentIngredient?.id ? '#EFF6FF' : '#FFFFFF'}
                    >
                      <XStack alignItems="center" gap="$3">
                        <Text fontSize={20}>{ing.icon}</Text>
                        <YStack gap="$0.5">
                          <Text fontSize={14.5} fontWeight="700" color="#0F172A">
                            {ing.name}
                          </Text>
                          <Text fontSize={12} color="#64748B">
                            {ing.caloriesPer100g} kcal / 100g (P:{ing.proteinPer100g}g • C:{ing.carbsPer100g}g • F:{ing.fatPer100g}g)
                          </Text>
                        </YStack>
                      </XStack>
                      <Text fontSize={13} color="#0055D4" fontWeight="700">
                        {ing.id === currentIngredient?.id ? 'Đang chọn' : 'Chọn ›'}
                      </Text>
                    </XStack>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </YStack>
        )}

        {/* Thẻ nguyên liệu đang chọn */}
        {currentIngredient && (
          <XStack
            backgroundColor="#F8FAFC"
            padding="$3"
            borderRadius={18}
            borderWidth={1}
            borderColor="#E2E8F0"
            alignItems="center"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              <Text fontSize={26}>{currentIngredient.icon}</Text>
              <YStack flex={1} gap="$1">
                <Text fontSize={15} fontWeight="800" color="#0F172A">
                  {currentIngredient.name}
                </Text>
                <Text fontSize={12} color="#64748B">
                  Định lượng: {currentIngredient.caloriesPer100g} kcal / 100g
                </Text>
              </YStack>
            </XStack>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setIsSearchFocused(true)}>
              <Text fontSize={13} color="#0055D4" fontWeight="700">
                Đổi món
              </Text>
            </TouchableOpacity>
          </XStack>
        )}

        {/* Khối lượng cân (gam) với khoảng cách thoáng đãng */}
        <YStack gap="$2">
          <Text fontSize={13.5} fontWeight="700" color="#475569">
            Khối lượng cân:
          </Text>
          <XStack alignItems="center" gap="$2">
            <XStack
              flex={1}
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="#F8FAFC"
              borderRadius={22}
              borderWidth={1.5}
              borderColor="#E2E8F0"
              paddingHorizontal="$3"
              height={48}
            >
              <TouchableOpacity
                onPress={() => setInputGrams((prev) => Math.max(10, prev - 10))}
                activeOpacity={0.6}
              >
                <Text fontSize={22} fontWeight="700" color="#64748B" paddingHorizontal="$2">
                  -
                </Text>
              </TouchableOpacity>

              <Text fontSize={17} fontWeight="900" color="#0F172A">
                {inputGrams} gam
              </Text>

              <TouchableOpacity
                onPress={() => setInputGrams((prev) => prev + 10)}
                activeOpacity={0.6}
              >
                <Text fontSize={22} fontWeight="700" color="#64748B" paddingHorizontal="$2">
                  +
                </Text>
              </TouchableOpacity>
            </XStack>

            <TouchableOpacity activeOpacity={0.7} onPress={() => setInputGrams((prev) => prev + 50)}>
              <View
                backgroundColor="#F1F5F9"
                borderRadius={20}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={12.5} fontWeight="800" color="#0055D4">+50g</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => setInputGrams((prev) => prev + 100)}>
              <View
                backgroundColor="#F1F5F9"
                borderRadius={20}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="#E2E8F0"
              >
                <Text fontSize={12.5} fontWeight="800" color="#0055D4">+100g</Text>
              </View>
            </TouchableOpacity>
          </XStack>
        </YStack>

        {/* Nút thêm vào mâm */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleAddIngredient}>
          <View
            height={50}
            borderRadius={25}
            backgroundColor={currentIngredient ? '#0055D4' : '#94A3B8'}
            alignItems="center"
            justifyContent="center"
            marginTop="$1"
            style={THEME.shadow}
          >
            <XStack alignItems="center" gap="$2">
              <Text fontSize={16} color="#FFFFFF">
                ⚡
              </Text>
              <Text color="#FFFFFF" fontSize={15} fontWeight="800">
                {currentIngredient
                  ? `Thêm ${currentIngredient.name} (${inputGrams}g) vào mâm`
                  : 'Chọn nguyên liệu để thêm vào mâm'}
              </Text>
            </XStack>
          </View>
        </TouchableOpacity>
      </YStack>

      {/* ========================================================================= */}
      {/* 2. SECTION: MÂM ĂN ĐA NGUYÊN LIỆU (TỪNG MÓN CÓ CÁCH NẤU RIÊNG) */}
      {/* ========================================================================= */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={24}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$4"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16.5} fontWeight="800" color="#0F172A">
            2. Mâm ăn của bạn
          </Text>
          <View
            backgroundColor="#F1F5F9"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={14}
          >
            <Text fontSize={12} fontWeight="700" color="#475569">
              {plateItems.length} món • {plateTotals.totalWeight}g
            </Text>
          </View>
        </XStack>

        {plateItems.length === 0 ? (
          <YStack padding="$5" alignItems="center" justifyContent="center">
            <Text fontSize={34}>🥗</Text>
            <Text fontSize={13.5} fontWeight="600" color="#94A3B8" marginTop="$2" textAlign="center">
              Mâm ăn đang trống. Hãy chọn nguyên liệu và cân gram ở trên để thêm vào mâm!
            </Text>
          </YStack>
        ) : (
          <YStack gap="$3">
            {plateTotals.itemDetails.map((item) => (
              <YStack
                key={item.id}
                padding="$4"
                backgroundColor="#F8FAFC"
                borderRadius={20}
                borderWidth={1}
                borderColor="#E2E8F0"
                gap="$3"
              >
                {/* HÀNG 1: TÊN MÓN, KHỐI LƯỢNG & TỔNG CALO */}
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$3" flex={1}>
                    <View
                      width={44}
                      height={44}
                      borderRadius={14}
                      backgroundColor="#FFFFFF"
                      alignItems="center"
                      justifyContent="center"
                      borderWidth={1}
                      borderColor="#E2E8F0"
                      overflow="hidden"
                    >
                      {item.ingredient.imageUrl ? (
                        <Image
                          source={{ uri: item.ingredient.imageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text fontSize={22}>{item.ingredient.icon}</Text>
                      )}
                    </View>

                    <YStack flex={1} gap="$0.5">
                      <Text fontSize={15.5} fontWeight="800" color="#0F172A">
                        {item.ingredient.name}
                      </Text>
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize={12.5} color="#0055D4" fontWeight="800">
                          {item.grams}g
                        </Text>
                        <Text fontSize={11.5} color="#64748B">
                          (Gốc: {item.bCal} kcal)
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  {/* Tổng Calo món (đã tính theo cách chế biến) + Nút Xóa */}
                  <XStack alignItems="center" gap="$3">
                    <YStack alignItems="flex-end" gap="$0.5">
                      <Text fontSize={16.5} fontWeight="900" color="#0055D4">
                        {item.totalItemCalories} kcal
                      </Text>
                      {item.extras.extraCalories > 0 ? (
                        <Text fontSize={11} fontWeight="700" color="#EA580C">
                          +{item.extras.extraCalories} kcal dầu
                        </Text>
                      ) : (
                        <Text fontSize={11} fontWeight="600" color="#16A34A">
                          0 kcal dầu
                        </Text>
                      )}
                    </YStack>

                    <TouchableOpacity activeOpacity={0.7} onPress={() => handleRemoveItem(item.id)}>
                      <View
                        width={30}
                        height={30}
                        borderRadius={15}
                        backgroundColor="#FEE2E2"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={13} color="#DC2626" fontWeight="900">
                          ✕
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* HÀNG 2: CHỌN / ĐỔI CÁCH CHẾ BIẾN TRỰC TIẾP TRÊN THẺ */}
                <YStack gap="$1.5" paddingTop="$1.5" borderTopWidth={1} borderColor="#F1F5F9">
                  <Text fontSize={12} fontWeight="700" color="#64748B">
                    Cách chế biến món này:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap="$2" paddingVertical="$0.5">
                      {AVAILABLE_METHODS.map((method) => {
                        const isSelected = item.cookingMethodId === method.id;
                        return (
                          <TouchableOpacity
                            key={method.id}
                            activeOpacity={0.75}
                            onPress={() => handleChangeItemMethod(item.id, method.id)}
                          >
                            <View
                              paddingHorizontal="$3.5"
                              paddingVertical="$1.8"
                              borderRadius={14}
                              backgroundColor={isSelected ? '#0055D4' : '#FFFFFF'}
                              borderWidth={1}
                              borderColor={isSelected ? '#0055D4' : '#CBD5E1'}
                            >
                              <XStack alignItems="center" gap="$1.5">
                                <Text fontSize={12}>{method.icon}</Text>
                                <Text
                                  fontSize={12}
                                  fontWeight={isSelected ? '800' : '600'}
                                  color={isSelected ? '#FFFFFF' : '#475569'}
                                >
                                  {method.name.split('/')[0].trim()}
                                </Text>
                              </XStack>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </XStack>
                  </ScrollView>
                </YStack>

                {/* HÀNG 3: CHI TIẾT DẦU MỠ & GIA VỊ + BỘ CHỈNH GRAM */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  backgroundColor="#FFFFFF"
                  paddingHorizontal="$3.5"
                  paddingVertical="$2.5"
                  borderRadius={14}
                  borderWidth={1}
                  borderColor="#F1F5F9"
                >
                  <Text fontSize={12} color="#475569" fontWeight="600" flex={1}>
                    {item.extras.note}
                  </Text>

                  {/* Nút tăng giảm nhanh 50g */}
                  <XStack alignItems="center" gap="$2">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAdjustItemGrams(item.id, -50)}
                    >
                      <View
                        paddingHorizontal="$2.5"
                        paddingVertical="$1"
                        borderRadius={8}
                        backgroundColor="#F1F5F9"
                        borderWidth={1}
                        borderColor="#E2E8F0"
                      >
                        <Text fontSize={11.5} fontWeight="800" color="#475569">
                          -50g
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAdjustItemGrams(item.id, 50)}
                    >
                      <View
                        paddingHorizontal="$2.5"
                        paddingVertical="$1"
                        borderRadius={8}
                        backgroundColor="#EFF6FF"
                        borderWidth={1}
                        borderColor="#BFDBFE"
                      >
                        <Text fontSize={11.5} fontWeight="800" color="#0055D4">
                          +50g
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleEditItemGrams(item.id)}
                    >
                      <Text fontSize={14} color="#64748B" paddingLeft="$1.5">
                        ✏️
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* HÀNG 4: MACROS CỦA MÓN - GIÃN CÁCH THOÁNG ĐẸP */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  paddingTop="$2"
                  paddingHorizontal="$1"
                  gap="$2"
                >
                  <View
                    flex={1}
                    backgroundColor="#F0FDF4"
                    paddingVertical="$1.5"
                    borderRadius={10}
                    alignItems="center"
                    borderWidth={1}
                    borderColor="#DCFCE7"
                  >
                    <Text fontSize={12} color="#15803D" fontWeight="700">
                      Đạm: <Text fontWeight="900">{item.totalItemProtein}g</Text>
                    </Text>
                  </View>

                  <View
                    flex={1}
                    backgroundColor="#FFF7ED"
                    paddingVertical="$1.5"
                    borderRadius={10}
                    alignItems="center"
                    borderWidth={1}
                    borderColor="#FFEDD5"
                  >
                    <Text fontSize={12} color="#C2410C" fontWeight="700">
                      Béo: <Text fontWeight="900">{item.totalItemFat}g</Text>
                    </Text>
                  </View>

                  <View
                    flex={1}
                    backgroundColor="#EFF6FF"
                    paddingVertical="$1.5"
                    borderRadius={10}
                    alignItems="center"
                    borderWidth={1}
                    borderColor="#DBEAFE"
                  >
                    <Text fontSize={12} color="#1D4ED8" fontWeight="700">
                      Carb: <Text fontWeight="900">{item.totalItemCarbs}g</Text>
                    </Text>
                  </View>
                </XStack>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>

      {/* ========================================================================= */}
      {/* 3. SECTION: TỔNG NĂNG LƯỢNG & MACROS MÂM CƠM (GIÃN CÁCH THOÁNG ĐÃNG) */}
      {/* ========================================================================= */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={24}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$4"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$1">
            <Text fontSize={11} color="#64748B" fontWeight="700" letterSpacing={0.5}>
              TỔNG KẾT NĂNG LƯỢNG MÂM CƠM
            </Text>
            <Text fontSize={16.5} fontWeight="900" color="#0F172A">
              Khối lượng & Dinh dưỡng gộp
            </Text>
          </YStack>

          <Text fontSize={28} fontWeight="900" color="#0055D4">
            {plateTotals.totalCalories}
            <Text fontSize={15} fontWeight="800" color="#0055D4">
              {' '}kcal
            </Text>
          </Text>
        </XStack>

        {/* THẺ TỔNG HỢP: CALO GỐC VS CALO DẦU MỠ - GIÃN CÁCH RỘNG RÃI */}
        <YStack
          backgroundColor="#F8FAFC"
          padding="$4"
          borderRadius={20}
          borderWidth={1}
          borderColor="#E2E8F0"
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center" paddingVertical="$1">
            <Text fontSize={13.5} color="#475569" fontWeight="600">
              ⚖️ Tổng trọng lượng mâm:
            </Text>
            <Text fontSize={15} fontWeight="900" color="#0F172A">
              {plateTotals.totalWeight} gam
            </Text>
          </XStack>

          <View height={1} backgroundColor="#EDF2F7" />

          <XStack justifyContent="space-between" alignItems="center" paddingVertical="$1">
            <Text fontSize={13.5} color="#475569" fontWeight="600">
              🥩 Calo gốc thực phẩm:
            </Text>
            <Text fontSize={15} fontWeight="800" color="#334155">
              {plateTotals.baseCalories} kcal
            </Text>
          </XStack>

          <View height={1} backgroundColor="#EDF2F7" />

          <XStack justifyContent="space-between" alignItems="center" paddingVertical="$1">
            <Text fontSize={13.5} color="#EA580C" fontWeight="700">
              🫒 Dầu ăn & gia vị chế biến:
            </Text>
            <Text fontSize={15} fontWeight="900" color="#EA580C">
              +{plateTotals.totalExtraCalories} kcal (~{plateTotals.totalOilGrams}g dầu)
            </Text>
          </XStack>
        </YStack>

        {/* 3 THANH PROGRESS BAR CHO MACROS - GIÃN CÁCH THOÁNG MẮT */}
        <YStack gap="$4" paddingTop="$2">
          {/* 1. Chất đạm (Protein) */}
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13.5} color="#0F172A" fontWeight="700">
                ● Chất đạm (Protein)
              </Text>
              <Text fontSize={13.5} color="#64748B" fontWeight="600">
                <Text color="#0F172A" fontWeight="900">{plateTotals.totalProtein}g</Text> ({plateTotals.proteinPercentage}% calo)
              </Text>
            </XStack>
            <View height={8} backgroundColor="#E2E8F0" borderRadius={4} overflow="hidden">
              <View
                width={`${Math.min(100, plateTotals.proteinPercentage * 2.5)}%`}
                height="100%"
                backgroundColor="#0055D4"
                borderRadius={4}
              />
            </View>
          </YStack>

          {/* 2. Tinh bột (Carb) */}
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13.5} color="#0F172A" fontWeight="700">
                ● Tinh bột (Carb)
              </Text>
              <Text fontSize={13.5} color="#64748B" fontWeight="600">
                <Text color="#0F172A" fontWeight="900">{plateTotals.totalCarbs}g</Text> ({plateTotals.carbPercentage}% calo)
              </Text>
            </XStack>
            <View height={8} backgroundColor="#E2E8F0" borderRadius={4} overflow="hidden">
              <View
                width={`${Math.min(100, plateTotals.carbPercentage * 2.5)}%`}
                height="100%"
                backgroundColor="#F59E0B"
                borderRadius={4}
              />
            </View>
          </YStack>

          {/* 3. Chất béo (Lipid) */}
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13.5} color="#0F172A" fontWeight="700">
                ● Chất béo (Lipid - bao gồm dầu mỡ chế biến)
              </Text>
              <Text fontSize={13.5} color="#64748B" fontWeight="600">
                <Text color="#0F172A" fontWeight="900">{plateTotals.totalFat}g</Text> ({plateTotals.fatPercentage}% calo)
              </Text>
            </XStack>
            <View height={8} backgroundColor="#E2E8F0" borderRadius={4} overflow="hidden">
              <View
                width={`${Math.min(100, plateTotals.fatPercentage * 2.5)}%`}
                height="100%"
                backgroundColor="#EA580C"
                borderRadius={4}
              />
            </View>
          </YStack>
        </YStack>
      </YStack>

      {/* ========================================================================= */}
      {/* 4. NÚT LƯU BỮA TỰ NẤU (TỐI MÀU & VÔ HIỆU HÓA KHI MÂM RỖNG) */}
      {/* ========================================================================= */}
      <XStack alignItems="center" marginTop="$1" marginBottom="$4">
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving || plateItems.length === 0}
        >
          <View
            height={54}
            borderRadius={27}
            backgroundColor={plateItems.length === 0 ? '#94A3B8' : '#0055D4'}
            alignItems="center"
            justifyContent="center"
            style={THEME.shadow}
          >
            <XStack alignItems="center" gap="$2">
              <Text fontSize={16} color="#FFFFFF">
                ✓
              </Text>
              <Text color="#FFFFFF" fontSize={15.5} fontWeight="800">
                {plateItems.length === 0
                  ? 'Thêm nguyên liệu vào mâm để lưu'
                  : isSaving
                  ? 'Đang lưu...'
                  : `Lưu bữa tự nấu (~${plateTotals.totalCalories} kcal)`}
              </Text>
            </XStack>
          </View>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
};
