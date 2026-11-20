import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'tamagui';
import { THEME } from '../../src/constants/theme';
import { AppIcon } from '../../src/components/AppIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: THEME.colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, focused, size }) => <AppIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Nhật ký',
          tabBarLabel: 'Nhật ký',
          tabBarIcon: ({ color, focused, size }) => <AppIcon name={focused ? 'book' : 'book-outline'} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="goal"
        options={{
          title: 'Mục tiêu',
          tabBarLabel: 'Mục tiêu',
          tabBarIcon: ({ color, focused, size }) => <AppIcon name={focused ? 'flag' : 'flag-outline'} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, focused, size }) => <AppIcon name={focused ? 'person' : 'person-outline'} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
