import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text, View, XStack, YStack } from 'tamagui';
import { calculateMacroGoals } from '../constants/macroGoals';
import { THEME } from '../constants/theme';

interface MacroRingProps {
  calories: number;
  calorieGoal: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface MacroProgressBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
  icon: string;
}

const RING_SIZE = 204;
const RING_STROKE_WIDTH = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ANIMATION_DURATION = 700;

const createArcPath = (progress: number) => {
  if (progress <= 0) return '';
  const startX = RING_SIZE / 2;
  const startY = RING_SIZE / 2 - RING_RADIUS;
  const angle = progress * 2 * Math.PI;
  const endX = RING_SIZE / 2 + RING_RADIUS * Math.sin(angle);
  const endY = RING_SIZE / 2 - RING_RADIUS * Math.cos(angle);
  const largeArcFlag = progress > 0.5 ? 1 : 0;

  return `M ${startX} ${startY} A ${RING_RADIUS} ${RING_RADIUS} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const toSafeNumber = (value: number) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatNumber = (value: number) =>
  Math.round(Math.max(0, toSafeNumber(value))).toLocaleString('vi-VN');

const getCalorieColor = (percentage: number) => {
  if (percentage > 100) return THEME.colors.danger;
  if (percentage >= 90) return THEME.colors.success;
  return THEME.colors.primary;
};

const MacroProgressBar: React.FC<MacroProgressBarProps> = ({ label, value, goal, color, icon }) => {
  const progress = goal > 0 ? clamp(Math.max(0, value) / goal) : 0;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const percentage = goal > 0 ? Math.round((Math.max(0, value) / goal) * 100) : 0;
  const barColor = percentage > 100 ? THEME.colors.danger : color;

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimation]);

  return (
    <YStack
      flex={1}
      minWidth={0}
      padding="$3"
      gap="$2"
      borderRadius={12}
      borderWidth={1}
      borderColor={THEME.colors.borderLight}
      backgroundColor={THEME.colors.card}
    >
      <XStack alignItems="center" gap="$2">
        <Text fontSize={17}>{icon}</Text>
        <Text fontSize={13} fontWeight="800" color={THEME.colors.textMain}>{label}</Text>
      </XStack>
      <XStack alignItems="center" justifyContent="space-between" gap="$1">
        <Text fontSize={13} fontWeight="800" color={THEME.colors.textMain} numberOfLines={1}>
          {formatNumber(value)} / {formatNumber(goal)} g
        </Text>
        <View
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius={6}
          backgroundColor={percentage > 100 ? THEME.colors.proteinLight : THEME.colors.borderLight}
        >
          <Text fontSize={10} fontWeight="800" color={percentage > 100 ? THEME.colors.danger : color}>
            {percentage}%
          </Text>
        </View>
      </XStack>
      <View height={8} backgroundColor={THEME.colors.borderLight} borderRadius={9999} overflow="hidden">
        <Animated.View
          style={{
            height: '100%',
            width: progressAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: barColor,
            borderRadius: 9999,
          }}
        />
      </View>
    </YStack>
  );
};

export const MacroRing: React.FC<MacroRingProps> = ({
  calories,
  calorieGoal,
  carbs,
  protein,
  fat,
}) => {
  const safeCalories = Math.max(0, toSafeNumber(calories));
  const safeGoal = Math.max(0, toSafeNumber(calorieGoal));
  const caloriePercentage = safeGoal > 0 ? (safeCalories / safeGoal) * 100 : 0;
  const ringProgress = safeGoal > 0 ? clamp(safeCalories / safeGoal) : 0;
  const remainingCalories = Math.max(0, safeGoal - safeCalories);
  const exceededCalories = Math.max(0, safeCalories - safeGoal);
  const ringColor = getCalorieColor(caloriePercentage);
  const ringAnimation = useRef(new Animated.Value(0)).current;
  const macroGoals = calculateMacroGoals(safeGoal);

  useEffect(() => {
    Animated.timing(ringAnimation, {
      toValue: ringProgress,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ringProgress, ringAnimation]);

  return (
    <YStack backgroundColor={THEME.colors.card} padding="$5" borderRadius={28} gap="$5">
      <YStack alignItems="center" gap="$4">
        <View
          width={RING_SIZE}
          height={RING_SIZE}
          position="relative"
          alignItems="center"
          justifyContent="center"
          shadowColor={THEME.colors.primary}
          shadowOffset={{ width: 0, height: 8 }}
          shadowOpacity={0.12}
          shadowRadius={18}
        >
          <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={THEME.colors.borderLight}
              strokeWidth={RING_STROKE_WIDTH}
              fill={THEME.colors.card}
            />
            <Path
              d={createArcPath(ringProgress)}
              stroke={ringColor}
              strokeWidth={RING_STROKE_WIDTH}
              strokeLinecap="round"
              fill="transparent"
              opacity={1}
            />
          </Svg>
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
            gap="$1"
          >
            <Text fontSize={12} fontWeight="700" color={THEME.colors.textMuted} letterSpacing={1}>
              CALO NẠP
            </Text>
            <XStack alignItems="baseline" gap="$1">
              <Text fontSize={30} fontWeight="800" color={THEME.colors.textMain}>
                {formatNumber(safeCalories)}
              </Text>
              <Text fontSize={12} color={THEME.colors.textMuted}>/ {formatNumber(safeGoal)} kcal</Text>
            </XStack>
            <Text fontSize={20} fontWeight="900" color={ringColor}>{Math.round(caloriePercentage)}%</Text>
          </YStack>
        </View>

        <View
          width="100%"
          paddingHorizontal="$2"
          paddingVertical="$2"
          borderRadius={THEME.radius.full}
          backgroundColor={caloriePercentage > 100 ? THEME.colors.proteinLight : THEME.colors.primaryLight}
          alignItems="center"
        >
          <Text
            fontSize={11}
            fontWeight="700"
            color={caloriePercentage > 100 ? THEME.colors.danger : THEME.colors.primaryDark}
          >
            {caloriePercentage > 100
              ? `Vượt: ${formatNumber(exceededCalories)} cal`
              : `Còn lại: ${formatNumber(remainingCalories)} cal`}
          </Text>
        </View>

        <XStack width="100%" gap="$2" alignItems="stretch">
          <MacroProgressBar label="Carb" icon="🌾" value={carbs} goal={macroGoals.carbs} color={THEME.colors.calories} />
          <MacroProgressBar label="Protein" icon="💪" value={protein} goal={macroGoals.protein} color={THEME.colors.primary} />
          <MacroProgressBar label="Fat" icon="💧" value={fat} goal={macroGoals.fat} color={THEME.colors.protein} />
        </XStack>
      </YStack>
    </YStack>
  );
};
