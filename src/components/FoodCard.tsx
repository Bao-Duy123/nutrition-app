import React, { useState } from 'react';
import { XStack, YStack, Text, Button, Image, View } from 'tamagui';
import { Food } from '../types/database';
import { THEME } from '../constants/theme';

interface FoodCardProps {
  food: Food;
  onAddMeal?: (food: Food, quantity: number) => Promise<void> | void;
  isLoading?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, onAddMeal, isLoading = false }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [imageError, setImageError] = useState<boolean>(false);

  const handleDecrease = () => {
    if (quantity > 0.5) {
      setQuantity((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))));
    }
  };

  const handleIncrease = () => {
    setQuantity((prev) => Number((prev + 0.5).toFixed(1)));
  };

  const calculatedCalories = Math.round(Number(food.calories || 0) * quantity);

  return (
    <XStack
      backgroundColor={THEME.colors.card}
      padding="$3"
      borderRadius={THEME.radius.md}
      borderWidth={1}
      borderColor={THEME.colors.border}
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 1 }}
      shadowOpacity={0.05}
      shadowRadius={4}
    >
      {/* ẢNH THỰC PHẨM BÊN TRÁI */}
      <View
        width={60}
        height={60}
        borderRadius={THEME.radius.sm}
        overflow="hidden"
        backgroundColor={THEME.colors.background}
        alignItems="center"
        justifyContent="center"
      >
        {food.image_url && !imageError ? (
          <Image
            source={{ uri: food.image_url }}
            width={60}
            height={60}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Text fontSize={24}>🥗</Text>
        )}
      </View>

      {/* TÊN VÀ THÔNG SỐ CALO Ở GIỮA */}
      <YStack flex={1} gap="$1">
        <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain} numberOfLines={1}>
          {food.name}
        </Text>
        <Text fontSize={12} color={THEME.colors.textMuted}>
          Khẩu phần: {food.serving_size}
        </Text>
        <XStack alignItems="center" gap="$2">
          <Text fontSize={13} fontWeight="700" color={THEME.colors.calories}>
            {calculatedCalories} kcal
          </Text>
          <Text fontSize={11} color={THEME.colors.textLight}>
            P:{food.protein}g | C:{food.carbs}g | F:{food.fat}g
          </Text>
        </XStack>
      </YStack>

      {/* CỤM NÚT [-] 1 [+] VÀ THÊM BÊN PHẢI */}
      <YStack alignItems="flex-end" gap="$2">
        <XStack
          alignItems="center"
          backgroundColor={THEME.colors.background}
          borderRadius={THEME.radius.sm}
          borderWidth={1}
          borderColor={THEME.colors.border}
          paddingHorizontal="$1"
          paddingVertical="$1"
        >
          <Button
            backgroundColor="transparent"
            borderWidth={0}
            paddingHorizontal="$2"
            onPress={handleDecrease}
          >
            <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
              -
            </Text>
          </Button>

          <Text fontSize={13} fontWeight="700" color={THEME.colors.primaryDark} paddingHorizontal="$2">
            {quantity}
          </Text>

          <Button
            backgroundColor="transparent"
            borderWidth={0}
            paddingHorizontal="$2"
            onPress={handleIncrease}
          >
            <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
              +
            </Text>
          </Button>
        </XStack>

        {onAddMeal && (
          <Button
            backgroundColor={THEME.colors.primary}
            borderRadius={THEME.radius.sm}
            paddingHorizontal="$3"
            paddingVertical="$1"
            disabled={isLoading}
            onPress={() => onAddMeal(food, quantity)}
          >
            <Text fontSize={12} fontWeight="700" color="#FFFFFF">
              {isLoading ? '...' : '+ Thêm'}
            </Text>
          </Button>
        )}
      </YStack>
    </XStack>
  );
};
