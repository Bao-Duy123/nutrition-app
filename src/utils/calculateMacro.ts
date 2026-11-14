import { DailyMeal, DailyMacroSummary, Profile } from '../types/database';

/**
 * Tính toán BMR theo phương trình Mifflin-St Jeor
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
 * Tính TDEE (Total Daily Energy Expenditure) với mức hoạt động trung bình (1.375)
 */
export const calculateTDEE = (bmr: number, activityMultiplier: number = 1.375): number => {
  return Math.round(bmr * activityMultiplier);
};

/**
 * Tính mức Calo khuyến nghị theo mục tiêu
 */
export const calculateSuggestedCalorie = (tdee: number, goalType: string = 'Giữ cân'): number => {
  const goal = goalType.toLowerCase();
  if (goal.includes('giảm')) {
    return Math.max(1200, Math.round(tdee - 500));
  }
  if (goal.includes('tăng')) {
    return Math.round(tdee + 500);
  }
  return Math.round(tdee);
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
