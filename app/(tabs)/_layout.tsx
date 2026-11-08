import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'tamagui';
import { THEME } from '../../src/constants/theme';

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
          tabBarIcon: ({ color, focused }) => (
            <Text fontSize={focused ? 20 : 18}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Nhật ký',
          tabBarLabel: 'Nhật ký',
          tabBarIcon: ({ color, focused }) => (
            <Text fontSize={focused ? 20 : 18}>📖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="goal"
        options={{
          title: 'Mục tiêu',
          tabBarLabel: 'Mục tiêu',
          tabBarIcon: ({ color, focused }) => (
            <Text fontSize={focused ? 20 : 18}>🎯</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Text fontSize={focused ? 20 : 18}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
