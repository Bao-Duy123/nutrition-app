import { DailyMeal, Food } from '../types/database';
import { calculateTargetMacros } from './nutrition';

export interface MealSuggestionCandidate {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export interface MealSuggestionSummary {
  caloriesEaten: number;
  proteinEaten: number;
  calorieGoal: number;
  proteinGoal: number;
  remainingCalories: number;
  remainingProtein: number;
  mealLabel: string;
}

// Gửi ít ứng viên hơn sau khi đã xếp hạng local để giảm input token và độ trễ.
export const MAX_AI_CANDIDATES = 10;

const getMealLabel = (hour: number): string => {
  if (hour < 10) return 'bữa sáng';
  if (hour < 14) return 'bữa trưa';
  if (hour < 17) return 'bữa phụ';
  return 'bữa tối';
};

const getMealNutrition = (meal: DailyMeal) => {
  const quantity = Number(meal.quantity) || 1;
  const food = meal.foods;
  return {
    calories: Number(food?.calories ?? meal.calories ?? 0) * quantity,
    protein: Number(food?.protein ?? meal.protein ?? 0) * quantity,
  };
};

export const calculateMealSuggestionSummary = (
  meals: DailyMeal[],
  calorieGoal: number,
  now: Date = new Date()
): MealSuggestionSummary => {
  const eaten = meals.reduce(
    (total, meal) => {
      const nutrition = getMealNutrition(meal);
      return {
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
      };
    },
    { calories: 0, protein: 0 }
  );
  const safeCalorieGoal = Math.max(0, Number(calorieGoal) || 0);
  const proteinGoal = calculateTargetMacros(safeCalorieGoal).proteinGrams;

  return {
    caloriesEaten: Math.round(eaten.calories),
    proteinEaten: Math.round(eaten.protein * 10) / 10,
    calorieGoal: safeCalorieGoal,
    proteinGoal,
    remainingCalories: Math.max(0, Math.round(safeCalorieGoal - eaten.calories)),
    remainingProtein: Math.max(0, Math.round((proteinGoal - eaten.protein) * 10) / 10),
    mealLabel: getMealLabel(now.getHours()),
  };
};

export const filterMealSuggestionCandidates = (
  foods: Food[],
  meals: DailyMeal[],
  summary: MealSuggestionSummary,
  limit = MAX_AI_CANDIDATES
): MealSuggestionCandidate[] => {
  // Loại món đã ăn và món vượt quá calo còn lại trước khi gửi dữ liệu cho AI.
  const eatenFoodIds = new Set(
    meals.map((meal) => meal.food_id ?? meal.foods?.id).filter((id): id is number => Number.isFinite(id))
  );

  return foods
    .filter((food) => !eatenFoodIds.has(food.id))
    .map((food) => ({
      id: Number(food.id),
      name: food.name,
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
    }))
    .filter((food) => food.id > 0 && food.name && food.calories > 0 && food.calories <= summary.remainingCalories)
    .sort((a, b) => {
      const proteinGapA = Math.abs(summary.remainingProtein - a.protein);
      const proteinGapB = Math.abs(summary.remainingProtein - b.protein);
      return proteinGapA - proteinGapB || a.calories - b.calories;
    })
    .slice(0, limit);
};

