import axios from 'axios';
import { MealSuggestionCandidate, MealSuggestionSummary } from '../utils/mealSuggestion';

export const GEMINI_SUGGESTION_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_SUGGESTION_MODEL}:generateContent`;

export interface AiMealPick {
  id: number;
  reason: string;
}

export interface AiMealSuggestionResponse {
  picks: AiMealPick[];
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    picks: {
      type: 'ARRAY',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          reason: { type: 'STRING' },
        },
        required: ['id', 'reason'],
      },
    },
  },
  required: ['picks'],
};

export const requestAiMealSuggestions = async (
  summary: MealSuggestionSummary,
  candidates: MealSuggestionCandidate[]
): Promise<AiMealSuggestionResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Thiếu EXPO_PUBLIC_GEMINI_API_KEY.');
  }

  // Dạng dòng ngắn giảm lặp key JSON; app vẫn giữ dữ liệu đầy đủ trong candidates.
  const compactCandidates = candidates
    .map((candidate) => `${candidate.id}|${candidate.name.replaceAll('|', '/')}|${Math.round(candidate.calories)}|${Math.round(candidate.protein * 10) / 10}`)
    .join('\n');
  const prompt = [
    `Gợi ý ${summary.mealLabel}. Còn ${summary.remainingCalories} kcal, ${summary.remainingProtein}g đạm.`,
    'Chọn đúng 3 id trong danh sách. Không tạo id/món mới. reason ngắn tiếng Việt. Chỉ trả JSON.',
    'Mỗi dòng: id|tên|kcal|đạm',
    compactCandidates,
  ].join('\n');

  const response = await axios.post(
    GEMINI_ENDPOINT,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
      },
    },
    {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
    }
  );

  const text = response.data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();
  if (!text) throw new Error('AI không trả về nội dung hợp lệ.');

  try {
    const parsed = JSON.parse(text) as Partial<AiMealSuggestionResponse>;
    if (!Array.isArray(parsed.picks) || parsed.picks.length !== 3) {
      throw new Error('AI không trả về đủ 3 món.');
    }
    return {
      picks: parsed.picks.map((pick) => ({
        id: Number(pick.id),
        reason: typeof pick.reason === 'string' ? pick.reason : 'Phù hợp với phần dinh dưỡng còn lại.',
      })),
    };
  } catch {
    throw new Error('AI trả về dữ liệu không đúng định dạng JSON.');
  }
};

