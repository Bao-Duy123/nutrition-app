import { DailyMeal, DailyMacroSummary, Profile } from '../types/database';

export type ActivityLevelKey = 'sedentary' | 'light' | 'moderate' | 'very_active';

export interface ActivityOption {
  key: ActivityLevelKey;
  label: string;
  sublabel: string;
  multiplier: number;
}

export const ACTIVITY_LEVELS: ActivityOption[] = [
  {
    key: 'sedentary',
    label: 'Ít vận động',
    sublabel: 'Công việc văn phòng, ít đi lại (x1.2)',
    multiplier: 1.2,
  },
  {
    key: 'light',
    label: 'Vận động nhẹ',
    sublabel: 'Tập luyện 1-3 buổi / tuần (x1.375)',
    multiplier: 1.375,
  },
  {
    key: 'moderate',
    label: 'Vận động vừa phải',
    sublabel: 'Tập luyện 3-5 buổi / tuần (x1.55)',
    multiplier: 1.55,
  },
  {
    key: 'very_active',
    label: 'Vận động nhiều',
    sublabel: 'Tập luyện cường độ cao 6-7 buổi / tuần (x1.725)',
    multiplier: 1.725,
  },
];

/**
 * Lấy hệ số vận động tương ứng từ chuỗi activity_level
 */
export const getActivityMultiplier = (activityLevel?: string | null): number => {
  if (!activityLevel) return 1.375;
  const normalized = activityLevel.toLowerCase();
  
  if (normalized.includes('ít') || normalized.includes('sedentary')) return 1.2;
  if (normalized.includes('nhẹ') || normalized.includes('light')) return 1.375;
  if (normalized.includes('vừa') || normalized.includes('moderate')) return 1.55;
  if (normalized.includes('nhiều') || normalized.includes('active') || normalized.includes('rất')) return 1.725;
  
  const parsed = parseFloat(activityLevel);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 2.5) return parsed;
  return 1.375;
};

/**
 * Tính toán BMR theo phương trình Mifflin-St Jeor chuẩn y khoa
 * Nam: 10 * weight + 6.25 * height - 5 * age + 5
 * Nữ: 10 * weight + 6.25 * height - 5 * age - 161
 */
export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string = 'Nam'
): number => {
  const isFemale = gender.toLowerCase().includes('nữ') || gender.toLowerCase() === 'female';
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(isFemale ? base - 161 : base + 5);
};

/**
 * Tính TDEE (Total Daily Energy Expenditure)
 */
export const calculateTDEE = (
  bmr: number,
  activityLevelOrMultiplier: string | number = 1.375
): number => {
  const multiplier =
    typeof activityLevelOrMultiplier === 'number'
      ? activityLevelOrMultiplier
      : getActivityMultiplier(activityLevelOrMultiplier);
  return Math.round(bmr * multiplier);
};

/**
 * Tính mức Calo khuyến nghị theo mục tiêu:
 * - Giảm cân: TDEE - 500 (tối thiểu 1200 kcal)
 * - Giữ cân: TDEE
 * - Tăng cân: TDEE + 300..500 kcal (mặc định + 261 hoặc + 500)
 */
export const calculateSuggestedCalorie = (
  tdee: number,
  goalType: string = 'Giữ cân'
): number => {
  const goal = goalType.toLowerCase();
  if (goal.includes('giảm')) {
    return Math.max(1200, Math.round(tdee - 500));
  }
  if (goal.includes('tăng')) {
    return Math.round(tdee + 261);
  }
  return Math.round(tdee);
};

export const calculateDailyCalorieGoal = calculateSuggestedCalorie;

/**
 * Tính toán đồng thời BMR, TDEE và mục tiêu Calo cho profile
 */
export const computeNutritionMetrics = (params: {
  currentWeight: number;
  height: number;
  age: number;
  gender?: string | null;
  activityLevel?: string | null;
  goalType?: string | null;
}) => {
  const bmr = calculateBMR(params.currentWeight, params.height, params.age, params.gender || 'Nam');
  const tdee = calculateTDEE(bmr, params.activityLevel || 'Vận động nhẹ');
  const dailyCalorieGoal = calculateDailyCalorieGoal(tdee, params.goalType || 'Giữ cân');
  return { bmr, tdee, dailyCalorieGoal };
};

/**
 * Tính tỷ lệ Gram của Carb, Protein, Fat tương ứng với mục tiêu Calo
 * Carbs: 50% (4 calo/g)
 * Protein: 25% (4 calo/g)
 * Fat: 25% (9 calo/g)
 */
export const calculateTargetMacros = (calorieGoal: number) => {
  const carbCalories = calorieGoal * 0.5;
  const proteinCalories = calorieGoal * 0.25;
  const fatCalories = calorieGoal * 0.25;

  return {
    carbGrams: Math.round(carbCalories / 4),
    proteinGrams: Math.round(proteinCalories / 4),
    fatGrams: Math.round(fatCalories / 9),
  };
};

/**
 * Tính tổng dưỡng chất từ danh sách các món ăn đã tiêu thụ trong ngày
 */
export const calculateMealsTotal = (
  meals: DailyMeal[],
  dailyGoal: number = 2000
): DailyMacroSummary => {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  meals.forEach((meal) => {
    const qty = Number(meal.quantity) || 1;
    const food = meal.foods;
    if (food) {
      calories += Number(food.calories || 0) * qty;
      protein += Number(food.protein || 0) * qty;
      carbs += Number(food.carbs || 0) * qty;
      fat += Number(food.fat || 0) * qty;
    } else if (meal.calories != null) {
      calories += Number(meal.calories || 0) * qty;
      protein += Number(meal.protein || 0) * qty;
      carbs += Number(meal.carbs || 0) * qty;
      fat += Number(meal.fat || 0) * qty;
    }
  });

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    calorieGoal: dailyGoal,
  };
};
