export const MACRO_GOAL_RATIOS = {
  carbs: 0.5,
  protein: 0.2,
  fat: 0.3,
} as const;

export const MACRO_CALORIES_PER_GRAM = {
  carbs: 4,
  protein: 4,
  fat: 9,
} as const;

export interface MacroGoals {
  carbs: number;
  protein: number;
  fat: number;
}

export const calculateMacroGoals = (dailyCalories: number): MacroGoals => {
  const goal = Number.isFinite(dailyCalories) && dailyCalories > 0 ? dailyCalories : 0;

  return {
    carbs: (goal * MACRO_GOAL_RATIOS.carbs) / MACRO_CALORIES_PER_GRAM.carbs,
    protein: (goal * MACRO_GOAL_RATIOS.protein) / MACRO_CALORIES_PER_GRAM.protein,
    fat: (goal * MACRO_GOAL_RATIOS.fat) / MACRO_CALORIES_PER_GRAM.fat,
  };
};
