import React from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { THEME } from '../../constants/theme';
import { Profile } from '../../types/database';

interface ProfileMenuListProps {
  profile: Profile | null;
  onPressHealthProfile?: () => void;
  onPressBodyStats?: () => void;
  onPressReminders?: () => void;
  onPressChangePassword?: () => void;
}

export const ProfileMenuList: React.FC<ProfileMenuListProps> = ({
  profile,
  onPressHealthProfile,
  onPressBodyStats,
  onPressReminders,
  onPressChangePassword,
}) => {
  // Format subtitle thông số cơ thể: "170cm, 70kg, Nam, 28 tuổi"
  const bodyStatsSubtitle = [
    profile?.height ? `${profile.height}cm` : null,
    profile?.current_weight ? `${profile.current_weight}kg` : null,
    profile?.gender || null,
    profile?.age ? `${profile.age} tuổi` : null,
  ]
    .filter(Boolean)
    .join(', ') || 'Chưa thiết lập';

  const healthProfileSubtitle = profile?.goal_type
    ? `${profile.goal_type} • ${profile.daily_calorie_goal || 2000} kcal`
    : 'Chỉ số & chế độ';

  return (
    <YStack
      backgroundColor={THEME.colors.card}
      borderRadius={THEME.radius.lg}
      borderWidth={1}
      borderColor={THEME.colors.borderLight}
      overflow="hidden"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.03}
      shadowRadius={6}
    >
      {/* 1. HỒ SƠ SỨC KHỎE */}
      <XStack
        paddingVertical="$3.5"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor={THEME.colors.borderLight}
        onPress={onPressHealthProfile}
        cursor="pointer"
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="#E8EEFF"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={18}>🪪</Text>
          </View>
          <YStack flex={1} gap="$0.5">
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Hồ sơ sức khỏe
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} numberOfLines={1}>
              {healthProfileSubtitle}
            </Text>
          </YStack>
        </XStack>

        <Text fontSize={16} color={THEME.colors.textLight}>
          ›
        </Text>
      </XStack>

      {/* 2. THÔNG SỐ CƠ THỂ */}
      <XStack
        paddingVertical="$3.5"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor={THEME.colors.borderLight}
        onPress={onPressBodyStats}
        cursor="pointer"
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="#EEF2FF"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={18}>📏</Text>
          </View>
          <YStack flex={1} gap="$0.5">
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Thông số cơ thể
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} numberOfLines={1}>
              {bodyStatsSubtitle}
            </Text>
          </YStack>
        </XStack>

        <Text fontSize={16} color={THEME.colors.textLight}>
          ›
        </Text>
      </XStack>

      {/* 3. NHẮC NHỞ */}
      <XStack
        paddingVertical="$3.5"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor={THEME.colors.borderLight}
        onPress={onPressReminders}
        cursor="pointer"
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="#E0F2FE"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={18}>🔔</Text>
          </View>
          <YStack flex={1} gap="$0.5">
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Nhắc nhở
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} numberOfLines={1}>
              Giờ ăn, & ghi chép calo
            </Text>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$2">
          <View width={8} height={8} borderRadius={4} backgroundColor={THEME.colors.primary} />
          <Text fontSize={16} color={THEME.colors.textLight}>
            ›
          </Text>
        </XStack>
      </XStack>

      {/* 4. ĐỔI MẬT KHẨU */}
      <XStack
        paddingVertical="$3.5"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        onPress={onPressChangePassword}
        cursor="pointer"
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="#FEF3C7"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={18}>🔒</Text>
          </View>
          <YStack flex={1} gap="$0.5">
            <Text fontSize={15} fontWeight="700" color={THEME.colors.textMain}>
              Đổi mật khẩu
            </Text>
            <Text fontSize={12} color={THEME.colors.textMuted} numberOfLines={1}>
              Bảo mật & quản lý mật khẩu tài khoản
            </Text>
          </YStack>
        </XStack>

        <Text fontSize={16} color={THEME.colors.textLight}>
          ›
        </Text>
      </XStack>
    </YStack>
  );
};
