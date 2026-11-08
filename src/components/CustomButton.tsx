import React from 'react';
import { Button, Text, Spinner, XStack, GetProps } from 'tamagui';
import { THEME } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: any;
  fullWidth?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}) => {
  let backgroundColor = THEME.colors.primary;
  let textColor = '#FFFFFF';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    backgroundColor = THEME.colors.primaryLight;
    textColor = THEME.colors.primaryDark;
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    textColor = THEME.colors.primary;
    borderWidth = 1.5;
    borderColor = THEME.colors.primary;
  } else if (variant === 'danger') {
    backgroundColor = THEME.colors.danger;
    textColor = '#FFFFFF';
  }

  const paddingVertical = size === 'small' ? 8 : size === 'large' ? 16 : 12;
  const paddingHorizontal = size === 'small' ? 14 : size === 'large' ? 24 : 18;
  const fontSize = size === 'small' ? 13 : size === 'large' ? 17 : 15;

  return (
    <Button
      onPress={onPress}
      disabled={disabled || loading}
      opacity={disabled ? 0.6 : 1}
      backgroundColor={backgroundColor}
      borderWidth={borderWidth}
      borderColor={borderColor}
      paddingVertical={paddingVertical}
      paddingHorizontal={paddingHorizontal}
      borderRadius={THEME.radius.md}
      width={fullWidth ? '100%' : 'auto'}
    >
      <XStack alignItems="center" justifyContent="center" gap="$2">
        {loading ? (
          <Spinner size="small" color={textColor} />
        ) : (
          <>
            {icon && icon}
            <Text color={textColor} fontSize={fontSize} fontWeight="700">
              {title}
            </Text>
          </>
        )}
      </XStack>
    </Button>
  );
};
