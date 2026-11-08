/**
 * SUPABASE DATABASE SCHEMA TYPES
 * Tuân thủ chính xác schema database của đề bài
 */

export interface Profile {
  id: string; // UUID, Primary Key, reference auth.users
  full_name: string | null;
  gender: string | null; // Nam, Nữ, Khác
  age: number | null;
  height: number | null; // cm
  current_weight: number | null; // kg
  target_weight: number | null; // kg
  goal_type: string | null; // Giảm cân, Giữ cân, Tăng cân
  daily_calorie_goal: number | null;
}

export interface Food {
  id: number; // Serial, Primary Key
  name: string;
  serving_size: string; // ví dụ: "100g", "1 chén", "1 đĩa"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url: string | null;
}

export type MealTimeType = 'Sáng' | 'Trưa' | 'Tối' | 'Ăn vặt';

export interface DailyMeal {
  id: number; // Serial, Primary Key
  user_id: string; // UUID, reference profiles.id
  food_id: number; // Integer, reference foods.id
  quantity: number; // Hệ số phần ăn (vd: 1, 1.5, 2)
  meal_time: MealTimeType | string;
  consumed_date: string; // YYYY-MM-DD
  foods?: Food; // Join quan hệ từ bảng foods
}

export interface WeightHistory {
  id: number; // Serial, Primary Key
  user_id: string; // UUID
  weight: number; // kg
  recorded_date: string; // YYYY-MM-DD
}

export interface DailyMacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
}
