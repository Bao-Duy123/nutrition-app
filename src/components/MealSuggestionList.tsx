import React, { useEffect, useRef } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import { Button, Spinner, Text, View, XStack, YStack } from 'tamagui';
import { THEME } from '../constants/theme';
import { MealSuggestion } from '../hooks/useMealSuggestion';
import { MealSuggestionSummary } from '../utils/mealSuggestion';

interface SuggestionCardProps {
  food: MealSuggestion;
  onAdd: () => void;
  adding: boolean;
  wide: boolean;
  index: number;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ food, onAdd, adding, wide, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], width: wide ? '32%' : '100%' }}>
      <YStack
        backgroundColor={THEME.colors.card}
        borderRadius={THEME.radius.lg}
        borderWidth={1}
        borderColor={THEME.colors.borderLight}
        padding="$3"
        gap="$2"
        height="100%"
      >
        <Text fontSize={15} fontWeight="800" color={THEME.colors.textMain} numberOfLines={2}>
          {food.name}
        </Text>
        <Text fontSize={12} color={THEME.colors.textMuted}>{food.serving_size}</Text>
        <XStack gap="$2" flexWrap="wrap">
          <Text fontSize={12} fontWeight="800" color={THEME.colors.calories}>{food.calories} kcal</Text>
          <Text fontSize={12} fontWeight="700" color={THEME.colors.primaryDark}>P: {food.protein}g</Text>
        </XStack>
        <Text fontSize={12} color={THEME.colors.textMuted} flex={1}>{food.reason}</Text>
        <Button
          backgroundColor={THEME.colors.primary}
          borderRadius={THEME.radius.md}
          disabled={adding}
          onPress={onAdd}
        >
          <Text color="#FFFFFF" fontSize={12} fontWeight="800">{adding ? 'Đang thêm...' : 'Thêm vào bữa'}</Text>
        </Button>
      </YStack>
    </Animated.View>
  );
};

interface MealSuggestionListProps {
  suggestions: MealSuggestion[];
  summary: MealSuggestionSummary | null;
  loading: boolean;
  error: string | null;
  empty: boolean;
  onGenerate: () => void;
  onAdd: (food: MealSuggestion) => void;
  addingId: number | null;
}

export const MealSuggestionList: React.FC<MealSuggestionListProps> = ({
  suggestions,
  summary,
  loading,
  error,
  empty,
  onGenerate,
  onAdd,
  addingId,
}) => {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  return (
    <YStack
      backgroundColor={THEME.colors.primaryLight}
      borderRadius={THEME.radius.xl}
      padding="$4"
      gap="$3"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize={17} fontWeight="800" color={THEME.colors.textMain}>✨ Gợi ý món ăn bằng AI</Text>
          <Text fontSize={12} color={THEME.colors.textMuted}>Gợi ý mang tính tham khảo</Text>
        </YStack>
        <Button
          backgroundColor={THEME.colors.primary}
          borderRadius={THEME.radius.md}
          disabled={loading}
          onPress={onGenerate}
        >
          {loading ? <Spinner size="small" color="#FFFFFF" /> : <Text color="#FFFFFF" fontSize={12} fontWeight="800">Gợi ý</Text>}
        </Button>
      </XStack>

      {summary && !loading && (
        <Text fontSize={12} color={THEME.colors.textMuted}>
          {summary.mealLabel}: còn {summary.remainingCalories} kcal · {summary.remainingProtein}g đạm
        </Text>
      )}
      {loading && <Text fontSize={12} color={THEME.colors.textMuted}>Đang lọc món và hỏi AI...</Text>}
      {!!error && (
        <YStack gap="$2">
          <Text fontSize={12} color={THEME.colors.danger}>{error}</Text>
          <Button alignSelf="flex-start" paddingHorizontal="$2" onPress={onGenerate} disabled={loading}>
            <Text color={THEME.colors.primaryDark} fontWeight="700">Thử lại</Text>
          </Button>
        </YStack>
      )}
      {empty && !error && (
        <Text fontSize={12} color={THEME.colors.textMuted}>Không còn món nào phù hợp với calo còn lại hôm nay.</Text>
      )}
      {suggestions.length > 0 && (
        <XStack flexWrap="wrap" gap="$2">
          {suggestions.map((food, index) => (
            <SuggestionCard
              key={food.id}
              food={food}
              index={index}
              wide={wide}
              adding={addingId === food.id}
              onAdd={() => onAdd(food)}
            />
          ))}
        </XStack>
      )}
    </YStack>
  );
};

