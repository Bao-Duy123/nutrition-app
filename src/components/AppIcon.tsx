import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type AppIconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string | null;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 20, color = '#334155' }) => (
  <Ionicons name={name} size={size} color={color} />
);
