import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DailyMeal, Food } from '../../types/database';
import { calculateMealsTotal } from '../../utils/calculateMacro';

interface DietState {
  todayMeals: DailyMeal[];
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  dailyCalorieGoal: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: DietState = {
  todayMeals: [],
  foods: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  dailyCalorieGoal: 2000,
  isLoading: false,
  error: null,
};

export const dietSlice = createSlice({
  name: 'diet',
  initialState,
  reducers: {
    setTodayMeals: (state, action: PayloadAction<DailyMeal[]>) => {
      state.todayMeals = action.payload;
      const totals = calculateMealsTotal(action.payload, state.dailyCalorieGoal);
      state.totalCalories = totals.calories;
      state.totalProtein = totals.protein;
      state.totalCarbs = totals.carbs;
      state.totalFat = totals.fat;
      state.isLoading = false;
    },
    addMealItem: (state, action: PayloadAction<DailyMeal>) => {
      state.todayMeals.push(action.payload);
      const totals = calculateMealsTotal(state.todayMeals, state.dailyCalorieGoal);
      state.totalCalories = totals.calories;
      state.totalProtein = totals.protein;
      state.totalCarbs = totals.carbs;
      state.totalFat = totals.fat;
    },
    removeMealItem: (state, action: PayloadAction<number>) => {
      state.todayMeals = state.todayMeals.filter((m) => m.id !== action.payload);
      const totals = calculateMealsTotal(state.todayMeals, state.dailyCalorieGoal);
      state.totalCalories = totals.calories;
      state.totalProtein = totals.protein;
      state.totalCarbs = totals.carbs;
      state.totalFat = totals.fat;
    },
    setFoods: (state, action: PayloadAction<Food[]>) => {
      state.foods = action.payload;
    },
    setDailyCalorieGoal: (state, action: PayloadAction<number>) => {
      state.dailyCalorieGoal = action.payload;
      const totals = calculateMealsTotal(state.todayMeals, action.payload);
      state.totalCalories = totals.calories;
    },
    setDietLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDietError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setTodayMeals,
  addMealItem,
  removeMealItem,
  setFoods,
  setDailyCalorieGoal,
  setDietLoading,
  setDietError,
} = dietSlice.actions;

export default dietSlice.reducer;
