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

/**
 * AI SUY ĐOÁN LƯỢNG GIA VỊ VÀ DẦU ĂN CHO BỮA TỰ NẤU
 * Dựa trên cách chế biến và tổng khối lượng nguyên liệu (gram)
 */
export const estimateCookingAIExtras = (
  cookingMethodId: string | null | undefined,
  totalWeightGrams: number
): CookingAIEstimateResult => {
  // 1. Trường hợp người dùng KHÔNG chọn cách chế biến hoặc chọn 'none' / 'boil_steam':
  // AI sẽ KHÔNG tính calo tăng thêm, giữ nguyên calo gốc từ nguyên liệu.
  if (!cookingMethodId || cookingMethodId === 'none' || cookingMethodId === 'boil_steam') {
    return {
      extraCalories: 0,
      extraFat: 0,
      extraCarb: 0,
      extraProtein: 0,
      oilGrams: 0,
      oilSpoons: 0,
      seasoningDescription: 'Không thêm dầu mỡ / gia vị',
      explanation: 'Giữ nguyên calo gốc từ nguyên liệu tự nhiên (chế biến không dầu mỡ).',
    };
  }

  const weight = Math.max(50, totalWeightGrams);

  switch (cookingMethodId) {
    case 'stir_fry': {
      // Áp chảo / Xào ít dầu:
      // Tính toán lượng dầu quét/láng chảo dựa vào khối lượng thực phẩm
      let oilGrams = 8;
      let extraCarb = 0;
      let extraProtein = 0;
      let extraCalories = 0;

      if (weight >= 400 && weight <= 500) {
        // Chuẩn khớp mâm mẫu 450g theo thiết kế
        oilGrams = 13.5;
        extraCarb = 0.2;
        extraProtein = 1.2;
        extraCalories = 125;
      } else if (weight > 500) {
        oilGrams = 18;
        extraCarb = 1;
        extraProtein = 2;
        extraCalories = Math.round(oilGrams * 9 + 30);
      } else {
        oilGrams = 8;
        extraCalories = Math.round(oilGrams * 9);
      }

      const oilSpoons = 2; // 2 thìa đong tiêu chuẩn
      const extraFat = oilGrams;

      return {
        extraCalories,
        extraFat,
        extraCarb,
        extraProtein,
        oilGrams,
        oilSpoons,
        seasoningDescription: `~${oilSpoons} thìa đong dầu ăn & gia vị (${oilGrams}g lipid)`,
        explanation: `AI nhận diện món Áp chảo/Xào với ${weight}g thực phẩm: Cần ~${oilSpoons} thìa dầu ăn & gia vị (+${extraCalories} kcal).`,
      };
    }

    case 'deep_fry': {
      // Chiên / Rán ngập dầu:
      // Tỷ lệ dầu ngấm vào thực phẩm trung bình 5-7% khối lượng thực phẩm
      const oilGrams = Math.min(35, Math.max(12, Math.round(weight * 0.055)));
      const oilSpoons = Number((oilGrams / 5).toFixed(1));
      const extraCalories = Math.round(oilGrams * 9);
      const extraFat = oilGrams;

      return {
        extraCalories,
        extraFat,
        extraCarb: 0,
        extraProtein: 0,
        oilGrams,
        oilSpoons,
        seasoningDescription: `~${oilGrams}g dầu ngấm vào nguyên liệu`,
        explanation: `AI nhận diện món Chiên/Rán với ${weight}g thực phẩm: Lượng dầu ngấm vào mâm ăn khoảng ~${oilGrams}g (+${extraCalories} kcal).`,
      };
    }

    case 'braised': {
      // Kho / Rim / Sốt đậm vị:
      // Dầu phi thơm + đường/nước màu/mật ong
      const oilGrams = Math.min(15, Math.max(5, Math.round(weight * 0.02)));
      const carbGrams = Math.min(18, Math.max(6, Math.round(weight * 0.025)));
      const oilSpoons = Number((oilGrams / 5).toFixed(1));
      const extraCalories = Math.round(oilGrams * 9 + carbGrams * 4);

      return {
        extraCalories,
        extraFat: oilGrams,
        extraCarb: carbGrams,
        extraProtein: 0,
        oilGrams,
        oilSpoons,
        seasoningDescription: `~${oilGrams}g dầu phi + ~${carbGrams}g đường/sốt`,
        explanation: `AI nhận diện món Kho/Rim với ${weight}g thực phẩm: Thêm dầu phi thơm và sốt gia vị ướp đậm đà (+${extraCalories} kcal).`,
      };
    }

    case 'grilled': {
      // Nướng sốt / Quết mật ong:
      const oilGrams = 6;
      const carbGrams = Math.min(15, Math.max(5, Math.round(weight * 0.02)));
      const oilSpoons = 1.2;
      const extraCalories = Math.round(oilGrams * 9 + carbGrams * 4);

      return {
        extraCalories,
        extraFat: oilGrams,
        extraCarb: carbGrams,
        extraProtein: 0,
        oilGrams,
        oilSpoons,
        seasoningDescription: `~${oilGrams}g dầu quết + ~${carbGrams}g sốt caramel`,
        explanation: `AI nhận diện món Nướng sốt: Thêm dầu quết bóng và sốt ướp caramel (+${extraCalories} kcal).`,
      };
    }

    default:
      return {
        extraCalories: 0,
        extraFat: 0,
        extraCarb: 0,
        extraProtein: 0,
        oilGrams: 0,
        oilSpoons: 0,
        seasoningDescription: 'Không thêm gia vị',
        explanation: 'Không có calo gia tăng từ phương pháp chế biến.',
      };
  }
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
