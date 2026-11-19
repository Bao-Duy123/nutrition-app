import {
  COOKING_METHODS,
  CookingMethod,
  RestaurantDish,
  RestaurantTopping,
} from '../data/vietnameseFoodData';

export interface CookingAIEstimateResult {
  extraCalories: number;
  extraFat: number;
  extraCarb: number;
  extraProtein: number;
  oilGrams: number;
  oilSpoons: number;
  seasoningDescription: string;
  explanation: string;
}

export interface EatingOutEstimateResult {
  baseCalories: number;
  toppingsCalories: number;
  brothCalories: number;
  manualAdjustment: number;
  totalCalories: number;
  totalCarb: number;
  totalProtein: number;
  totalFat: number;
  carbPercentage: number;
  proteinPercentage: number;
  fatPercentage: number;
}

export interface IngredientCookingExtras {
  cookingMethodId: string;
  cookingMethodName: string;
  cookingMethodIcon: string;
  oilGrams: number;
  oilSpoons: number;
  extraCalories: number;
  extraFat: number;
  extraCarb: number;
  extraProtein: number;
  note: string;
}

/**
 * TÍNH TOÁN DẦU MỠ & GIA VỊ CHO TỪNG NGUYÊN LIỆU THEO CÁCH CHẾ BIẾN VÀ TRỌNG LƯỢNG
 * - Chiên/Rán: Hấp thụ ~8% dầu theo khối lượng (300g = 24g dầu/216 kcal, 200g = 16g dầu/144 kcal)
 * - Áp chảo/Xào: Dầu láng chảo ~4% + 0.5% gia vị carbs
 * - Kho/Rim: 2% dầu phi + 2.5% gia vị đường/sốt carbs
 * - Nướng: 1.5% dầu quét + 1.5% sốt ướp carbs
 * - Luộc/Hấp/Tươi: 0g dầu, 0 kcal phụ
 */
export const calculateIngredientCookingExtras = (
  cookingMethodId: string = 'boil_steam',
  grams: number = 100
): IngredientCookingExtras => {
  const g = Math.max(0, grams);
  const methodId = cookingMethodId || 'boil_steam';

  switch (methodId) {
    case 'deep_fry': {
      // Chiên / Rán ngập dầu: hấp thụ 8% khối lượng
      // 100g -> 8g dầu (~72 kcal)
      // 200g -> 16g dầu (~144 kcal)
      // 300g -> 24g dầu (~216 kcal)
      const oilGrams = Math.round(g * 0.08 * 10) / 10;
      const extraFat = oilGrams;
      const extraCalories = Math.round(oilGrams * 9);
      const oilSpoons = Math.round((oilGrams / 5) * 10) / 10;
      return {
        cookingMethodId: 'deep_fry',
        cookingMethodName: 'Chiên / Rán',
        cookingMethodIcon: '🍟',
        oilGrams,
        oilSpoons,
        extraCalories,
        extraFat,
        extraCarb: 0,
        extraProtein: 0,
        note: `+${oilGrams}g dầu chiên (+${extraCalories} kcal)`,
      };
    }
    case 'stir_fry': {
      // Áp chảo / Xào: hấp thụ 4% dầu + 0.5% gia vị carbs
      // 100g -> 4g dầu + 0.5g carb = 38 kcal
      // 200g -> 8g dầu + 1.0g carb = 76 kcal
      // 300g -> 12g dầu + 1.5g carb = 114 kcal
      const oilGrams = Math.round(g * 0.04 * 10) / 10;
      const extraCarb = Math.round(g * 0.005 * 10) / 10;
      const extraFat = oilGrams;
      const extraCalories = Math.round(oilGrams * 9 + extraCarb * 4);
      const oilSpoons = Math.round((oilGrams / 5) * 10) / 10;
      return {
        cookingMethodId: 'stir_fry',
        cookingMethodName: 'Áp chảo / Xào',
        cookingMethodIcon: '🍳',
        oilGrams,
        oilSpoons,
        extraCalories,
        extraFat,
        extraCarb,
        extraProtein: 0,
        note: `+${oilGrams}g dầu xào (+${extraCalories} kcal)`,
      };
    }
    case 'braised': {
      // Kho / Rim: 2% dầu phi + 2.5% gia vị đường/sốt
      // 100g -> 2g dầu + 2.5g carb = 28 kcal
      // 200g -> 4g dầu + 5g carb = 56 kcal
      // 300g -> 6g dầu + 7.5g carb = 84 kcal
      const oilGrams = Math.round(g * 0.02 * 10) / 10;
      const extraCarb = Math.round(g * 0.025 * 10) / 10;
      const extraFat = oilGrams;
      const extraCalories = Math.round(oilGrams * 9 + extraCarb * 4);
      const oilSpoons = Math.round((oilGrams / 5) * 10) / 10;
      return {
        cookingMethodId: 'braised',
        cookingMethodName: 'Kho / Rim',
        cookingMethodIcon: '🍲',
        oilGrams,
        oilSpoons,
        extraCalories,
        extraFat,
        extraCarb,
        extraProtein: 0,
        note: `+${oilGrams}g dầu & sốt (+${extraCalories} kcal)`,
      };
    }
    case 'grilled': {
      // Nướng: 1.5% dầu quét bóng + 1.5% sốt ướp
      // 100g -> 1.5g dầu + 1.5g carb = ~20 kcal
      // 200g -> 3g dầu + 3g carb = ~39 kcal
      // 300g -> 4.5g dầu + 4.5g carb = ~59 kcal
      const oilGrams = Math.round(g * 0.015 * 10) / 10;
      const extraCarb = Math.round(g * 0.015 * 10) / 10;
      const extraFat = oilGrams;
      const extraCalories = Math.round(oilGrams * 9 + extraCarb * 4);
      const oilSpoons = Math.round((oilGrams / 5) * 10) / 10;
      return {
        cookingMethodId: 'grilled',
        cookingMethodName: 'Nướng',
        cookingMethodIcon: '🔥',
        oilGrams,
        oilSpoons,
        extraCalories,
        extraFat,
        extraCarb,
        extraProtein: 0,
        note: `+${oilGrams}g dầu quét & sốt (+${extraCalories} kcal)`,
      };
    }
    case 'boil_steam':
    case 'none':
    default: {
      return {
        cookingMethodId: methodId,
        cookingMethodName: methodId === 'none' ? 'Ăn tươi / Sống' : 'Luộc / Hấp',
        cookingMethodIcon: methodId === 'none' ? '🥗' : '💧',
        oilGrams: 0,
        oilSpoons: 0,
        extraCalories: 0,
        extraFat: 0,
        extraCarb: 0,
        extraProtein: 0,
        note: 'Thanh đạm (+0 kcal dầu)',
      };
    }
  }
};

/**
 * AI SUY ĐOÁN LƯỢNG GIA VỊ VÀ DẦU ĂN CHO BỮA TỰ NẤU
 * (Hàm tương thích cho toàn bộ mâm hoặc tổng khối lượng)
 */
export const estimateCookingAIExtras = (
  cookingMethodId: string | null | undefined,
  totalWeightGrams: number
): CookingAIEstimateResult => {
  const extras = calculateIngredientCookingExtras(cookingMethodId || 'boil_steam', totalWeightGrams);
  return {
    extraCalories: extras.extraCalories,
    extraFat: extras.extraFat,
    extraCarb: extras.extraCarb,
    extraProtein: extras.extraProtein,
    oilGrams: extras.oilGrams,
    oilSpoons: extras.oilSpoons,
    seasoningDescription: extras.note,
    explanation: `${extras.cookingMethodName} với ${totalWeightGrams}g: ${extras.note}`,
  };
};

/**
 * TÍNH TOÁN CALO & MACRO CHO BỮA ĂN NGOÀI QUÁN TIỆM
 * (Theo cấu trúc ảnh Ăn ngoài.png)
 */
export const calculateEatingOutTotal = (
  dish: RestaurantDish,
  portionType: 'standard' | 'special',
  selectedToppingInput: string[] | Record<string, number>,
  brothLevel: 'lean' | 'medium' | 'rich',
  manualAdjustment: number = 0
): EatingOutEstimateResult => {
  const portion = portionType === 'standard' ? dish.standardPortion : dish.specialPortion;

  let baseCalories = portion.calories;
  let totalCarb = portion.carbs;
  let totalProtein = portion.protein;
  let totalFat = portion.fat;

  // 1. Toppings tính theo số lượng (Quantity multiplier: e.g. 0.5 quẩy, 2 trứng, 3 trứng...)
  let toppingsCalories = 0;
  dish.toppings.forEach((top) => {
    let qty = 0;
    if (Array.isArray(selectedToppingInput)) {
      if (selectedToppingInput.includes(top.id)) qty = 1;
    } else if (selectedToppingInput && typeof selectedToppingInput === 'object') {
      qty = Number(selectedToppingInput[top.id]) || 0;
    }

    if (qty > 0) {
      toppingsCalories += Math.round(top.calories * qty);
      totalCarb += Math.round(top.carbs * qty * 10) / 10;
      totalProtein += Math.round(top.protein * qty * 10) / 10;
      totalFat += Math.round(top.fat * qty * 10) / 10;
    }
  });

  // 2. Nước dùng / Độ béo quán
  let brothCalories = 0;
  if (brothLevel === 'medium') {
    brothCalories = 40;
    totalFat += 4.5;
  } else if (brothLevel === 'rich') {
    brothCalories = 80;
    totalFat += 9.0;
  }

  const rawTotalCalories = baseCalories + toppingsCalories + brothCalories + manualAdjustment;
  const totalCalories = Math.max(0, Math.round(rawTotalCalories));

  // Tỷ lệ % Calo theo macronutrients
  const carbCal = totalCarb * 4;
  const proteinCal = totalProtein * 4;
  const fatCal = totalFat * 9;
  const sumCal = carbCal + proteinCal + fatCal || 1;

  const carbPercentage = Math.round((carbCal / sumCal) * 100);
  const proteinPercentage = Math.round((proteinCal / sumCal) * 100);
  const fatPercentage = Math.max(0, 100 - carbPercentage - proteinPercentage);

  return {
    baseCalories,
    toppingsCalories,
    brothCalories,
    manualAdjustment,
    totalCalories,
    totalCarb: Math.round(totalCarb * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    carbPercentage,
    proteinPercentage,
    fatPercentage,
  };
};
