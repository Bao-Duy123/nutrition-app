import React from 'react';
import { Text, View, XStack, YStack } from 'tamagui';
import { THEME } from '../constants/theme';

interface MacroRingProps {
  calories: number;
  calorieGoal: number;
  carbs: number;
  protein: number;
  fat: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  calories,
  calorieGoal,
  carbs,
  protein,
  fat,
}) => {
  const goal = calorieGoal > 0 ? calorieGoal : 2000;
  const calPercent = Math.min(Math.round((calories / goal) * 100), 100);
  const remainingCalories = Math.max(0, goal - calories);
  const macros = [
    { label: 'Carb', value: carbs, color: THEME.colors.calories },
    { label: 'Protein', value: protein, color: THEME.colors.primary },
    { label: 'Fat', value: fat, color: THEME.colors.protein },
  ];

  return (
    <YStack
      backgroundColor={THEME.colors.card}
      padding="$5"
      borderRadius={28}
      gap="$5"
    >
      <YStack alignItems="center" gap="$4">
        <View
          width={204}
          height={204}
          borderRadius={102}
          borderWidth={12}
          borderColor={THEME.colors.primary}
          alignItems="center"
          justifyContent="center"
          backgroundColor="#FFFFFF"
          shadowColor={THEME.colors.primary}
          shadowOffset={{ width: 0, height: 8 }}
          shadowOpacity={0.12}
          shadowRadius={18}
        >
          <Text fontSize={12} fontWeight="700" color={THEME.colors.textMuted} letterSpacing={1}>
            CALO NẠP
          </Text>
          <XStack alignItems="baseline" gap="$1">
            <Text fontSize={30} fontWeight="800" color={THEME.colors.textMain}>
              {Math.round(calories).toLocaleString('vi-VN')}
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted}>
              / {goal.toLocaleString('vi-VN')}
            </Text>
          </XStack>
          <View
            backgroundColor={THEME.colors.primaryLight}
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={THEME.radius.full}
          >
            <Text fontSize={11} fontWeight="600" color={THEME.colors.primaryDark}>
              {remainingCalories > 0
                ? `Còn lại: ${remainingCalories.toLocaleString('vi-VN')} cal`
                : `${calPercent}% mục tiêu`}
            </Text>
          </View>
        </View>

        <XStack width="100%" gap="$2">
          {macros.map((macro) => (
            <YStack
              key={macro.label}
              flex={1}
              alignItems="center"
              justifyContent="center"
              paddingVertical="$3"
              backgroundColor={THEME.colors.background}
              borderRadius={THEME.radius.sm}
              gap="$1"
            >
              <XStack alignItems="center" gap="$1">
                <View width={8} height={8} borderRadius={4} backgroundColor={macro.color} />
                <Text fontSize={12} color={THEME.colors.textMuted}>{macro.label}</Text>
              </XStack>
              <Text fontSize={17} fontWeight="800" color={THEME.colors.textMain}>
                {Math.round(macro.value)}
                <Text fontSize={10} fontWeight="400" color={THEME.colors.textMuted}> g</Text>
              </Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    </YStack>
  );
};
