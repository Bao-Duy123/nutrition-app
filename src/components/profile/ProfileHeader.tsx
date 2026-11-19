import React from 'react';
import { YStack, XStack, Text, View, Image } from 'tamagui';
import { THEME } from '../../constants/theme';
import { Profile } from '../../types/database';
import { showAlert } from '../../utils/showAlert';

interface ProfileHeaderProps {
  profile: Profile | null;
  email?: string | null;
  onEditAvatar?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  email,
  onEditAvatar,
}) => {
  const bmrValue = profile?.bmr ?? 0;
  const tdeeValue = profile?.tdee ?? 0;
  const userIdDisplay = profile?.id ? profile.id.slice(0, 8).toUpperCase() : '---';

  const handleCopyId = () => {
    showAlert('Thông báo', `ID tài khoản: ${profile?.id || userIdDisplay}`);
  };

  return (
    <YStack gap="$4" alignItems="center">
      {/* AVATAR VỚI BADGE CAMERA */}
      <View position="relative" marginTop="$2">
        <View
          width={100}
          height={100}
          borderRadius={50}
          overflow="hidden"
          backgroundColor="#FEEAD2"
          borderWidth={3}
          borderColor="#FFFFFF"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.1}
          shadowRadius={8}
          alignItems="center"
          justifyContent="center"
        >
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              width={100}
              height={100}
              objectFit="cover"
            />
          ) : (
            <Text fontSize={42}>🧑</Text>
          )}
        </View>

        {/* Nút camera nhỏ ở góc dưới bên phải */}
        <View
          position="absolute"
          bottom={0}
          right={0}
          width={32}
          height={32}
          borderRadius={16}
          backgroundColor={THEME.colors.primary}
          borderWidth={2}
          borderColor="#FFFFFF"
          alignItems="center"
          justifyContent="center"
          onPress={onEditAvatar}
          cursor="pointer"
        >
          <Text fontSize={14} color="#FFFFFF">
            📷
          </Text>
        </View>
      </View>

      {/* TÊN VÀ ID / EMAIL */}
      <YStack alignItems="center" gap="$1">
        <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain} textAlign="center">
          {profile?.full_name || 'Chưa cập nhật tên'}
        </Text>

        <XStack alignItems="center" gap="$2" onPress={handleCopyId} cursor="pointer">
          <Text fontSize={13} color={THEME.colors.textMuted}>
            ID: {userIdDisplay}
          </Text>
          <Text fontSize={12} color={THEME.colors.primary}>
            📋
          </Text>
        </XStack>

        {email ? (
          <Text fontSize={12} color={THEME.colors.textLight}>
            {email}
          </Text>
        ) : null}
      </YStack>

      {/* BADGE HỘI VIÊN */}
      <View
        backgroundColor="#E8EEFF"
        paddingHorizontal="$3"
        paddingVertical="$1.5"
        borderRadius={THEME.radius.full}
      >
        <XStack alignItems="center" gap="$1.5">
          <View width={7} height={7} borderRadius={3.5} backgroundColor={THEME.colors.success} />
          <Text fontSize={12} fontWeight="600" color={THEME.colors.primaryDark}>
            {profile?.subscription_tier || 'Gói Hội Viên Pro - Tự do cân chỉnh'}
          </Text>
        </XStack>
      </View>

      {/* 2 THẺ METRICS: BMR CƠ SỞ & TDEE ƯỚC TÍNH */}
      <XStack width="100%" gap="$3" marginTop="$1">
        {/* BMR Card */}
        <YStack
          flex={1}
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.borderLight}
          gap="$2"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.03}
          shadowRadius={6}
        >
          <XStack justifyContent="space-between" alignItems="center" gap="$1">
            <XStack alignItems="center" gap="$1">
              <Text fontSize={14} fontWeight="600" color={THEME.colors.textMuted}>
                BMR cơ sở
              </Text>
              <View
                width={18}
                height={18}
                borderRadius={9}
                backgroundColor={THEME.colors.primaryLight}
                alignItems="center"
                justifyContent="center"
                onPress={() =>
                  showAlert(
                    'BMR cơ sở là gì?',
                    'BMR là năng lượng cơ thể ước tính cần để duy trì các hoạt động cơ bản khi nghỉ ngơi. Giá trị này được tính theo công thức Mifflin–St Jeor dựa trên cân nặng, chiều cao, tuổi và giới tính.'
                  )
                }
                role="button"
                aria-label="Giải thích BMR cơ sở"
                cursor="pointer"
              >
                <Text fontSize={12} fontWeight="800" color={THEME.colors.primaryDark}>i</Text>
              </View>
            </XStack>
            <Text fontSize={16} color={THEME.colors.primary}>
              ⚡
            </Text>
          </XStack>
          <XStack alignItems="baseline" gap="$1">
            <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain}>
              {bmrValue > 0 ? bmrValue.toLocaleString() : '---'}
            </Text>
            <Text fontSize={13} color={THEME.colors.textMuted}>
              kcal
            </Text>
          </XStack>
        </YStack>

        {/* TDEE Card */}
        <YStack
          flex={1}
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.borderLight}
          gap="$2"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.03}
          shadowRadius={6}
        >
          <XStack justifyContent="space-between" alignItems="center" gap="$1">
            <XStack alignItems="center" gap="$1">
              <Text fontSize={14} fontWeight="600" color={THEME.colors.textMuted}>
                TDEE ước tính
              </Text>
              <View
                width={18}
                height={18}
                borderRadius={9}
                backgroundColor={THEME.colors.primaryLight}
                alignItems="center"
                justifyContent="center"
                onPress={() =>
                  showAlert(
                    'TDEE ước tính là gì?',
                    'TDEE là tổng năng lượng cơ thể ước tính tiêu hao trong một ngày, gồm năng lượng cơ bản và hoạt động thể chất. Giá trị được ước tính bằng BMR nhân với hệ số hoạt động; nhu cầu thực tế có thể khác nhau.'
                  )
                }
                role="button"
                aria-label="Giải thích TDEE ước tính"
                cursor="pointer"
              >
                <Text fontSize={12} fontWeight="800" color={THEME.colors.primaryDark}>i</Text>
              </View>
            </XStack>
            <Text fontSize={16} color={THEME.colors.calories}>
              🔥
            </Text>
          </XStack>
          <XStack alignItems="baseline" gap="$1">
            <Text fontSize={22} fontWeight="800" color={THEME.colors.textMain}>
              {tdeeValue > 0 ? tdeeValue.toLocaleString() : '---'}
            </Text>
            <Text fontSize={13} color={THEME.colors.textMuted}>
              kcal
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  );
};
