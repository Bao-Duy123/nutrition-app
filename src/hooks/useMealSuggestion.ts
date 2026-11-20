import { useCallback, useState } from 'react';
import { requestAiMealSuggestions, AiMealPick } from '../services/aiSuggestion';
import { getFoodsForMealSuggestion } from '../services/mealSuggestionService';
import {
  calculateMealSuggestionSummary,
  filterMealSuggestionCandidates,
  MealSuggestionCandidate,
  MealSuggestionSummary,
} from '../utils/mealSuggestion';
import { DailyMeal, Food } from '../types/database';

export interface MealSuggestion extends Food {
  reason: string;
  isFallback?: boolean;
}

interface UseMealSuggestionResult {
  suggestions: MealSuggestion[];
  candidates: MealSuggestionCandidate[];
  summary: MealSuggestionSummary | null;
  loading: boolean;
  error: string | null;
  empty: boolean;
  generate: () => Promise<void>;
}

export const useMealSuggestion = (meals: DailyMeal[], calorieGoal: number): UseMealSuggestionResult => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [candidates, setCandidates] = useState<MealSuggestionCandidate[]>([]);
  const [summary, setSummary] = useState<MealSuggestionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const nextSummary = calculateMealSuggestionSummary(meals, calorieGoal);
      const foods = await getFoodsForMealSuggestion();
      const nextCandidates = filterMealSuggestionCandidates(foods, meals, nextSummary);
      setSummary(nextSummary);
      setCandidates(nextCandidates);

      if (nextCandidates.length === 0) return;

      try {
        const aiResponse = await requestAiMealSuggestions(nextSummary, nextCandidates);
        const candidateMap = new Map(nextCandidates.map((candidate) => [candidate.id, candidate]));
        const validPicks = aiResponse.picks
          .filter((pick: AiMealPick) => candidateMap.has(pick.id))
          .map((pick) => {
            const candidate = candidateMap.get(pick.id)!;
            const food = foods.find((item) => item.id === candidate.id);
            return food ? { ...food, reason: pick.reason } : null;
          })
          .filter((food): food is MealSuggestion => Boolean(food));

        // Kiểm tra id trước khi hiển thị; sai định dạng hoặc thiếu món thì dùng fallback.
        if (validPicks.length === 3) {
          setSuggestions(validPicks);
          return;
        }
        throw new Error('AI trả về id món không hợp lệ.');
      } catch {
        // Fallback bảo đảm UI vẫn có gợi ý khi AI lỗi, hết quota hoặc trả sai JSON.
        setSuggestions(
          nextCandidates.slice(0, 3).map((candidate) => ({
            ...(foods.find((food) => food.id === candidate.id) as Food),
            reason: 'Gợi ý tự động theo lượng đạm còn thiếu.',
            isFallback: true,
          }))
        );
        setError('AI đang không khả dụng; đang hiển thị gợi ý tự động.');
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể tải danh sách món phù hợp. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, [calorieGoal, meals]);

  return {
    suggestions,
    candidates,
    summary,
    loading,
    error,
    empty: !loading && Boolean(summary) && candidates.length === 0,
    generate,
  };
};

