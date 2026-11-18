import React from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';

interface AppInputProps extends TextInputProps {
  height?: number;
  backgroundColor?: string;
  borderRadius?: number | string;
  borderWidth?: number;
  borderColor?: string;
  paddingHorizontal?: number | string;
  fontSize?: number;
  color?: string;
  flex?: number;
}

const parseNumber = (val?: number | string, fallback?: number): number | undefined => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    if (val === '$2') return 8;
    if (val === '$3') return 12;
    if (val === '$4') return 16;
    if (val === '$5') return 20;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

export function Input({
  height = 48,
  backgroundColor = '#F3F4F6',
  borderRadius = 12,
  borderWidth = 0,
  borderColor = 'transparent',
  paddingHorizontal = 16,
  fontSize = 16,
  color = '#111827',
  flex,
  style,
  placeholderTextColor = '#9CA3AF',
  ...rest
}: AppInputProps) {
  const containerStyle: ViewStyle = {
    height,
    backgroundColor,
    borderRadius: parseNumber(borderRadius, 12),
    borderWidth,
    borderColor,
    paddingHorizontal: parseNumber(paddingHorizontal, 16),
    ...(flex !== undefined ? { flex } : {}),
  };

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor}
      style={[containerStyle, { fontSize, color }, style]}
      {...rest}
    />
  );
}