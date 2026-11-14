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
  COOKING_METHODS,
  RawIngredient,
} from '../data/vietnameseFoodData';
import { searchRawIngredients } from '../services/foodService';
import { estimateCookingAIExtras } from '../services/nutritionAIService';
import { saveUserRecipe } from '../services/supabase';
import { useAppSelector } from '../store';

export interface CookingPlateItem {
  id: string;
  ingredient: RawIngredient;
  grams: number;
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
  }) => Promise<void> | void;
  isSaving?: boolean;
}

export const HomeCookingView: React.FC<HomeCookingViewProps> = ({ onSaveMeal, isSaving = false }) => {
  const { userId } = useAppSelector((state) => state.auth);

  const [ingredientsList, setIngredientsList] = useState<RawIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<RawIngredient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inputGrams, setInputGrams] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mâm ăn bắt đầu rỗng - lấy và thêm nguyên liệu thật từ database
  const [plateItems, setPlateItems] = useState<CookingPlateItem[]>([]);

  // Cách chế biến & tên công thức
  const [selectedMethodId, setSelectedMethodId] = useState<string>('none');
  const [saveToRecipeBook, setSaveToRecipeBook] = useState<boolean>(false);
  const [recipeName, setRecipeName] = useState<string>('');

  // Danh mục nguyên liệu
  const ingredientCategories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'meat', label: '🥩 Thịt' },
    { id: 'seafood', label: '🐟 Hải sản' },
    { id: 'egg_dairy', label: '🥚 Trứng & Sữa' },
    { id: 'carb', label: '🍚 Tinh bột' },
    { id: 'veggie', label: '🥦 Rau củ' },
    { id: 'tofu_bean', label: '🧈 Đậu & Hạt' },
    { id: 'fat_seasoning', label: '🫒 Dầu & Gia vị' },
  ];

  // Nguyên liệu đang chọn
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

  // 1. Tính toán Calo & Macro GỐC từ các nguyên liệu thô
  const rawTotals = useMemo(() => {
    let totalWeight = 0;
    let baseCalories = 0;
    let baseProtein = 0;
    let baseCarbs = 0;
    let baseFat = 0;

    plateItems.forEach((item) => {
      totalWeight += item.grams;
      const factor = item.grams / 100;
      baseCalories += item.ingredient.caloriesPer100g * factor;
      baseProtein += item.ingredient.proteinPer100g * factor;
      baseCarbs += item.ingredient.carbsPer100g * factor;
      baseFat += item.ingredient.fatPer100g * factor;
    });

    return {
      totalWeight: Math.round(totalWeight),
      baseCalories: Math.round(baseCalories),
      baseProtein: Math.round(baseProtein * 10) / 10,
      baseCarbs: Math.round(baseCarbs * 10) / 10,
      baseFat: Math.round(baseFat * 10) / 10,
    };
  }, [plateItems]);

  // 2. AI SUY ĐOÁN LƯỢNG GIA VỊ & DẦU ĂN THEO CÁCH CHẾ BIẾN
  const aiExtras = useMemo(() => {
    return estimateCookingAIExtras(selectedMethodId, rawTotals.totalWeight);
  }, [selectedMethodId, rawTotals.totalWeight]);

  // 3. TỔNG HỢP CALO & MACRO GỘP CUỐI CÙNG
  const finalSummary = useMemo(() => {
    const totalCal = rawTotals.baseCalories + aiExtras.extraCalories;
    const totalProtein = rawTotals.baseProtein + aiExtras.extraProtein;
    const totalCarbs = rawTotals.baseCarbs + aiExtras.extraCarb;
    const totalFat = rawTotals.baseFat + aiExtras.extraFat;

    const carbCal = totalCarbs * 4;
    const proteinCal = totalProtein * 4;
    const fatCal = totalFat * 9;
    const sumCal = carbCal + proteinCal + fatCal || 1;

    const carbPercentage = Math.round((carbCal / sumCal) * 100);
    const proteinPercentage = Math.round((proteinCal / sumCal) * 100);
    const fatPercentage = Math.max(0, 100 - carbPercentage - proteinPercentage);

    return {
      totalCalories: Math.round(totalCal),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      carbPercentage,
      proteinPercentage,
      fatPercentage,
    };
  }, [rawTotals, aiExtras]);

  // Thêm nguyên liệu vào mâm
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
      id: `item_${Date.now()}`,
      ingredient: currentIngredient,
      grams: inputGrams,
    };

    setPlateItems((prev) => [...prev, newItem]);
    if (!recipeName) {
      setRecipeName(`Bữa ăn tự nấu (${plateItems.length + 1} món)`);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Chỉnh sửa gram trực tiếp của một món
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
      : setPlateItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, grams: it.grams >= 200 ? 100 : it.grams + 50 } : it
          )
        );
  };

  // Xóa nguyên liệu khỏi mâm
  const handleRemoveItem = (id: string) => {
    setPlateItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Lưu bữa tự nấu
  const handleSave = async () => {
    if (plateItems.length === 0) {
      Alert.alert('Mâm ăn trống', 'Vui lòng thêm ít nhất một nguyên liệu từ database vào mâm ăn.');
      return;
    }

    const dishTitle = recipeName.trim() || `Bữa cơm tự nấu (${plateItems.length} món)`;
    const ingredientDetails = plateItems
      .map((i) => `${i.ingredient.name} (${i.grams}g)`)
      .join(', ');

    const currentMethodObj = COOKING_METHODS.find((m) => m.id === selectedMethodId);
    const methodText = currentMethodObj?.name || 'Không chọn';

    const details = `Tự nấu: ${dishTitle} [${methodText}]. Nguyên liệu: ${ingredientDetails}. AI gia vị/dầu: +${aiExtras.extraCalories} kcal.`;

    // 1. Lưu vào bảng user_recipes nếu người dùng chọn lưu công thức
    if (saveToRecipeBook && userId) {
      try {
        await saveUserRecipe(userId, {
          recipe_name: dishTitle,
          cooking_method: selectedMethodId,
          total_weight: rawTotals.totalWeight,
          total_calories: finalSummary.totalCalories,
          protein: finalSummary.totalProtein,
          carbs: finalSummary.totalCarbs,
          fat: finalSummary.totalFat,
          ingredients_json: plateItems.map((p) => ({
            id: p.ingredient.id,
            name: p.ingredient.name,
            grams: p.grams,
          })),
        });
      } catch (e) {
        console.warn('Lỗi khi lưu user_recipe:', e);
      }
    }

    // 2. Lưu bữa ăn vào nhật ký (bảng daily_meals & foods)
    onSaveMeal({
      dishName: dishTitle,
      totalCalories: finalSummary.totalCalories,
      protein: finalSummary.totalProtein,
      carbs: finalSummary.totalCarbs,
      fat: finalSummary.totalFat,
      servingSize: `${rawTotals.totalWeight}g mâm ăn`,
      details,
    });
  };

  return (
    <YStack gap="$3.5">
      {/* 1. SECTION: NHẬP THỰC PHẨM CÂN (GAM) */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={22}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$3.5"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16} fontWeight="800" color="#0F172A">
            1. Nhập thực phẩm cân (gam)
          </Text>
          <View
            backgroundColor="#EEF2FF"
            borderWidth={1}
            borderColor="#E0E7FF"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={14}
          >
            <Text fontSize={11.5} fontWeight="700" color="#4F46E5">
              Thịt, cá, cơm, rau củ
            </Text>
          </View>
        </XStack>

        {/* Ô tìm kiếm nguyên liệu */}
        <XStack
          alignItems="center"
          backgroundColor="#F8FAFC"
          borderRadius={14}
          borderWidth={1.5}
          borderColor={isSearchFocused ? '#0055D4' : '#E2E8F0'}
          paddingHorizontal="$3.5"
          height={48}
        >
          <Text fontSize={16} marginRight="$2.5" color="#64748B">
            🔍
          </Text>
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            fontSize={14}
            fontWeight="600"
            color="#0F172A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={`Ức gà phi lê (sống)`}
            placeholderTextColor="#94A3B8"
            height={46}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <View
                width={22}
                height={22}
                borderRadius={11}
                backgroundColor="#E2E8F0"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={11} color="#64748B" fontWeight="700">
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
            borderRadius={14}
            borderWidth={1}
            borderColor="#E2E8F0"
            maxHeight={220}
            overflow="hidden"
          >
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              {ingredientsList.length === 0 ? (
                <YStack padding="$3" alignItems="center">
                  <Text fontSize={13} color="#94A3B8">
                    Không tìm thấy "{searchQuery}" trong kho nguyên liệu.
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
                      paddingVertical="$2.5"
                      paddingHorizontal="$3.5"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottomWidth={idx < ingredientsList.length - 1 ? 1 : 0}
                      borderColor="#F1F5F9"
                      backgroundColor={ing.id === currentIngredient?.id ? '#EFF6FF' : '#FFFFFF'}
                    >
                      <XStack alignItems="center" gap="$2.5">
                        <Text fontSize={18}>{ing.icon}</Text>
                        <YStack>
                          <Text fontSize={14} fontWeight="700" color="#0F172A">
                            {ing.name}
                          </Text>
                          <Text fontSize={11.5} color="#64748B">
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

        {/* Stepper điều chỉnh số gram & chip cộng nhanh */}
        <XStack alignItems="center" gap="$2.5">
          <XStack
            flex={1}
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="#F8FAFC"
            borderRadius={22}
            borderWidth={1.5}
            borderColor="#E2E8F0"
            paddingHorizontal="$3"
            height={44}
          >
            <TouchableOpacity
              onPress={() => setInputGrams((prev) => Math.max(10, prev - 10))}
              activeOpacity={0.6}
            >
              <Text fontSize={20} fontWeight="700" color="#64748B" paddingHorizontal="$2">
                -
              </Text>
            </TouchableOpacity>

            <Text fontSize={17} fontWeight="900" color="#0F172A">
              {inputGrams}g
            </Text>

            <TouchableOpacity
              onPress={() => setInputGrams((prev) => prev + 10)}
              activeOpacity={0.6}
            >
              <Text fontSize={20} fontWeight="700" color="#64748B" paddingHorizontal="$2">
                +
              </Text>
            </TouchableOpacity>
          </XStack>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setInputGrams((prev) => prev + 50)}>
            <View
              backgroundColor="#F1F5F9"
              borderRadius={20}
              paddingHorizontal="$3.5"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <Text fontSize={12} fontWeight="800" color="#0055D4">+50g</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setInputGrams((prev) => prev + 100)}>
            <View
              backgroundColor="#F1F5F9"
              borderRadius={20}
              paddingHorizontal="$3.5"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="#E2E8F0"
            >
              <Text fontSize={12} fontWeight="800" color="#0055D4">+100g</Text>
            </View>
          </TouchableOpacity>
        </XStack>

        {/* Nút thêm thực phẩm cân vào mâm */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleAddIngredient}>
          <View
            height={48}
            borderRadius={24}
            backgroundColor={currentIngredient ? '#0055D4' : '#94A3B8'}
            alignItems="center"
            justifyContent="center"
            style={THEME.shadow}
          >
            <XStack alignItems="center" gap="$2">
              <Text fontSize={16} color="#FFFFFF">
                ⚡
              </Text>
              <Text color="#FFFFFF" fontSize={14.5} fontWeight="800">
                {currentIngredient
                  ? `Thêm ${currentIngredient.name} (${inputGrams}g) vào mâm`
                  : 'Chọn nguyên liệu từ database để thêm vào mâm'}
              </Text>
            </XStack>
          </View>
        </TouchableOpacity>
      </YStack>

      {/* 2. SECTION: NGUYÊN LIỆU TRONG MÂM ĂN */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={22}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$3.5"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16} fontWeight="800" color="#0F172A">
            Nguyên liệu trong mâm ăn
          </Text>
          <View
            backgroundColor="#F1F5F9"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={12}
          >
            <Text fontSize={12} fontWeight="700" color="#475569">
              {plateItems.length} món
            </Text>
          </View>
        </XStack>

        {plateItems.length === 0 ? (
          <YStack padding="$4" alignItems="center" justifyContent="center">
            <Text fontSize={26}>🥗</Text>
            <Text fontSize={13} color="#94A3B8" marginTop="$2">
              Chưa có nguyên liệu nào trong mâm ăn. Hãy thêm ở trên!
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2.5">
            {plateItems.map((item) => {
              const factor = item.grams / 100;
              const itemCal = Math.round(item.ingredient.caloriesPer100g * factor);
              const itemP = (item.ingredient.proteinPer100g * factor).toFixed(1);
              const itemC = (item.ingredient.carbsPer100g * factor).toFixed(1);
              const itemF = (item.ingredient.fatPer100g * factor).toFixed(1);

              return (
                <YStack
                  key={item.id}
                  padding="$3.5"
                  backgroundColor="#F8FAFC"
                  borderRadius={18}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  gap="$2"
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$3" flex={1}>
                      {/* Ảnh / Icon món ăn bo tròn */}
                      <View
                        width={46}
                        height={46}
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
                        <Text fontSize={14.5} fontWeight="800" color="#0F172A">
                          {item.ingredient.name}
                        </Text>
                        <Text fontSize={12} color="#64748B" fontWeight="600">
                          Khối lượng cân: <Text color="#0055D4" fontWeight="800">{item.grams}g</Text>
                        </Text>
                      </YStack>
                    </XStack>

                    <Text fontSize={15} fontWeight="900" color="#0F172A">
                      {itemCal} kcal
                    </Text>
                  </XStack>

                  {/* Hàng Macro & Nút Sửa / Xóa */}
                  <XStack justifyContent="space-between" alignItems="center" paddingTop="$1" borderTopWidth={1} borderColor="#F1F5F9">
                    <XStack gap="$3" alignItems="center">
                      <Text fontSize={11.5} color="#059669">
                        ● Đạm: <Text fontWeight="700">{itemP}g</Text>
                      </Text>
                      <Text fontSize={11.5} color="#EA580C">
                        ● Béo: <Text fontWeight="700">{itemF}g</Text>
                      </Text>
                      <Text fontSize={11.5} color="#2563EB">
                        ● Carb: <Text fontWeight="700">{itemC}g</Text>
                      </Text>
                    </XStack>

                    <XStack gap="$2" alignItems="center">
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditItemGrams(item.id)}>
                        <Text fontSize={14} color="#64748B">
                          ✏️
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleRemoveItem(item.id)}>
                        <Text fontSize={14} color="#DC2626">
                          🗑️
                        </Text>
                      </TouchableOpacity>
                    </XStack>
                  </XStack>
                </YStack>
              );
            })}

            {/* Nút: Thêm nguyên liệu tiếp theo */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSearchFocused(true)}
            >
              <View
                height={42}
                borderRadius={21}
                backgroundColor="#EFF6FF"
                borderWidth={1.5}
                borderColor="#BFDBFE"
                alignItems="center"
                justifyContent="center"
                marginTop="$1"
              >
                <XStack alignItems="center" gap="$1.5">
                  <Text fontSize={15} color="#0055D4" fontWeight="800">
                    ⊕
                  </Text>
                  <Text fontSize={13} fontWeight="800" color="#0055D4">
                    Thêm nguyên liệu tiếp theo
                  </Text>
                </XStack>
              </View>
            </TouchableOpacity>
          </YStack>
        )}
      </YStack>

      {/* 3. SECTION: CÁCH CHẾ BIẾN */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={22}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$3"
        style={THEME.shadow}
      >
        <Text fontSize={16} fontWeight="800" color="#0F172A">
          2. Cách chế biến món ăn
        </Text>

        {/* Danh sách các cách chế biến dạng List Cards */}
        <YStack gap="$2">
          {COOKING_METHODS.map((method) => {
            const isSelected = selectedMethodId === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                activeOpacity={0.8}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <XStack
                  paddingHorizontal="$3.5"
                  paddingVertical="$2.5"
                  borderRadius={14}
                  borderWidth={1.5}
                  borderColor={isSelected ? '#0055D4' : '#E2E8F0'}
                  backgroundColor={isSelected ? '#F0F7FF' : '#F8FAFC'}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <XStack alignItems="center" gap="$2.5">
                    <Text fontSize={18}>{method.icon}</Text>
                    <Text
                      fontSize={13.5}
                      fontWeight={isSelected ? '800' : '600'}
                      color={isSelected ? '#0055D4' : '#0F172A'}
                    >
                      {method.name.split('(')[0].trim()}
                    </Text>
                  </XStack>

                  <View
                    width={20}
                    height={20}
                    borderRadius={10}
                    borderWidth={2}
                    borderColor={isSelected ? '#0055D4' : '#CBD5E1'}
                    backgroundColor={isSelected ? '#0055D4' : '#FFFFFF'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && (
                      <View width={6} height={6} borderRadius={3} backgroundColor="#FFFFFF" />
                    )}
                  </View>
                </XStack>
              </TouchableOpacity>
            );
          })}
        </YStack>

        {/* AI GIẢI TRÌNH DẦU MỠ & GIA VỊ */}
        {aiExtras.extraCalories > 0 ? (
          <XStack
            backgroundColor="#F0FDF4"
            padding="$3"
            borderRadius={14}
            borderWidth={1}
            borderColor="#BBF7D0"
            alignItems="center"
            gap="$2.5"
          >
            <Text fontSize={18}>🤖</Text>
            <YStack flex={1} gap="$0.5">
              <Text fontSize={12.5} fontWeight="800" color="#15803D">
                AI ước tính: +{aiExtras.extraCalories} kcal gia vị & dầu ăn
              </Text>
              <Text fontSize={11.5} color="#166534">
                ~{aiExtras.oilSpoons} thìa dầu ăn cho {rawTotals.totalWeight}g thực phẩm
              </Text>
            </YStack>
          </XStack>
        ) : (
          <XStack
            backgroundColor="#F8FAFC"
            padding="$2.5"
            borderRadius={10}
            alignItems="center"
            gap="$2"
          >
            <Text fontSize={15}>💧</Text>
            <Text fontSize={12} color="#64748B" fontWeight="500">
              Chế biến thanh đạm • Giữ nguyên calo gốc từ thực phẩm (+0 kcal)
            </Text>
          </XStack>
        )}
      </YStack>

      {/* 4. SECTION: TỔNG NĂNG LƯỢNG & MACROS (THEO MOCKUP tự nấu.png) */}
      <YStack
        backgroundColor="#FFFFFF"
        padding="$4"
        borderRadius={22}
        borderWidth={1}
        borderColor="#E2E8F0"
        gap="$3.5"
        style={THEME.shadow}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$0.5">
            <Text fontSize={11} color="#64748B" fontWeight="700" letterSpacing={0.5}>
              TỔNG MÂM THỨC ĂN
            </Text>
            <Text fontSize={16} fontWeight="900" color="#0F172A">
              Khối lượng & Macros gộp
            </Text>
          </YStack>

          <Text fontSize={28} fontWeight="900" color="#0055D4">
            {finalSummary.totalCalories}
            <Text fontSize={15} fontWeight="800" color="#0055D4">
              {' '}kcal
            </Text>
          </Text>
        </XStack>

        {/* THẺ TỔNG HỢP THÀNH PHẦN (CÂN & THÌA ĐONG) */}
        <XStack
          backgroundColor="#F8FAFC"
          padding="$3"
          borderRadius={16}
          borderWidth={1}
          borderColor="#E2E8F0"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$3">
            <View
              width={42}
              height={42}
              borderRadius={12}
              backgroundColor="#DBEAFE"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={20}>⚖️</Text>
            </View>
            <YStack gap="$0.5">
              <Text fontSize={11.5} color="#64748B" fontWeight="600">
                Tổng hợp thành phần
              </Text>
              <Text fontSize={14.5} fontWeight="900" color="#0F172A">
                {rawTotals.totalWeight}g cân + {aiExtras.oilSpoons} thìa đong
              </Text>
            </YStack>
          </XStack>

          <View
            backgroundColor="#D1FAE5"
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={12}
          >
            <Text fontSize={11.5} fontWeight="800" color="#047857">
              Cân & Thìa chuẩn
            </Text>
          </View>
        </XStack>

        {/* 3 THANH PROGRESS BAR CHO MACROS */}
        <YStack gap="$3" paddingTop="$1">
          {/* 1. Chất đạm (Protein) */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13} color="#0F172A" fontWeight="700">
                ● Chất đạm (Protein)
              </Text>
              <Text fontSize={13} color="#64748B" fontWeight="700">
                <Text color="#0F172A" fontWeight="900">{finalSummary.totalProtein}g</Text> ({finalSummary.proteinPercentage}% calo)
              </Text>
            </XStack>
            <View height={6} backgroundColor="#E2E8F0" borderRadius={3} overflow="hidden">
              <View width={`${Math.min(100, finalSummary.proteinPercentage * 2.5)}%`} height="100%" backgroundColor="#0055D4" borderRadius={3} />
            </View>
          </YStack>

          {/* 2. Tinh bột (Carb) */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13} color="#0F172A" fontWeight="700">
                ● Tinh bột (Carb)
              </Text>
              <Text fontSize={13} color="#64748B" fontWeight="700">
                <Text color="#0F172A" fontWeight="900">{finalSummary.totalCarbs}g</Text> ({finalSummary.carbPercentage}% calo)
              </Text>
            </XStack>
            <View height={6} backgroundColor="#E2E8F0" borderRadius={3} overflow="hidden">
              <View width={`${Math.min(100, finalSummary.carbPercentage * 2.5)}%`} height="100%" backgroundColor="#F59E0B" borderRadius={3} />
            </View>
          </YStack>

          {/* 3. Chất béo (Lipid) */}
          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={13} color="#0F172A" fontWeight="700">
                ● Chất béo (Lipid - gồm dầu thìa)
              </Text>
              <Text fontSize={13} color="#64748B" fontWeight="700">
                <Text color="#0F172A" fontWeight="900">{finalSummary.totalFat}g</Text> ({finalSummary.fatPercentage}% calo)
              </Text>
            </XStack>
            <View height={6} backgroundColor="#E2E8F0" borderRadius={3} overflow="hidden">
              <View width={`${Math.min(100, finalSummary.fatPercentage * 2.5)}%`} height="100%" backgroundColor="#EA580C" borderRadius={3} />
            </View>
          </YStack>
        </YStack>

        {/* Tên món & Checkbox lưu công thức */}
        <YStack gap="$2.5" paddingTop="$2.5" borderTopWidth={1} borderColor="#F1F5F9">
          <XStack alignItems="center" gap="$2.5">
            <Text fontSize={13} color="#475569" fontWeight="700">
              🏷️ Tên món:
            </Text>
            <Input
              flex={1}
              height={40}
              backgroundColor="#F8FAFC"
              borderRadius={12}
              borderWidth={1}
              borderColor="#E2E8F0"
              fontSize={13}
              fontWeight="600"
              color="#0F172A"
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder={plateItems.length > 0 ? `Bữa cơm tự nấu (${plateItems.length} món)` : 'Nhập tên mâm ăn...'}
              placeholderTextColor="#94A3B8"
              paddingHorizontal="$3"
            />
          </XStack>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSaveToRecipeBook(!saveToRecipeBook)}
          >
            <XStack alignItems="center" gap="$2.5" marginTop="$1">
              <View
                width={20}
                height={20}
                borderRadius={6}
                borderWidth={1.5}
                borderColor={saveToRecipeBook ? '#0055D4' : '#CBD5E1'}
                backgroundColor={saveToRecipeBook ? '#0055D4' : '#FFFFFF'}
                alignItems="center"
                justifyContent="center"
              >
                {saveToRecipeBook && (
                  <Text color="#FFFFFF" fontSize={12} fontWeight="900" style={{ marginTop: -2 }}>
                    ✓
                  </Text>
                )}
              </View>
              <Text fontSize={13} color="#0F172A" fontWeight="600" flex={1}>
                Lưu công thức vào Sổ tay công thức (Database)
              </Text>
              <Text fontSize={16}>📖</Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </YStack>

      {/* 5. THANH THAO TÁC DƯỚI CÙNG (BOOKMARK + LƯU BỮA TỰ NẤU) */}
      <XStack gap="$3" alignItems="center" marginTop="$1">
        <TouchableOpacity activeOpacity={0.75}>
          <View
            width={52}
            height={52}
            borderRadius={26}
            backgroundColor="#FFFFFF"
            borderWidth={1.5}
            borderColor="#E2E8F0"
            alignItems="center"
            justifyContent="center"
            style={THEME.shadow}
          >
            <Text fontSize={20} color="#0F172A">
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
            height={52}
            borderRadius={26}
            backgroundColor="#0055D4"
            alignItems="center"
            justifyContent="center"
            style={THEME.shadow}
          >
            <XStack alignItems="center" gap="$2">
              <Text fontSize={16} color="#FFFFFF">
                ✓
              </Text>
              <Text color="#FFFFFF" fontSize={15} fontWeight="800">
                {isSaving ? 'Đang lưu...' : `Lưu bữa tự nấu (${finalSummary.totalCalories} kcal)`}
              </Text>
            </XStack>
          </View>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
};
