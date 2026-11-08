import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Input, ScrollView, Spinner, View } from 'tamagui';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { setProfile, clearAuth } from '../../src/store/slices/authSlice';
import { setDailyCalorieGoal } from '../../src/store/slices/dietSlice';
import {
  getUserProfile,
  logSupabaseError,
  logUnexpectedError,
  supabase,
  updateUserProfile,
} from '../../src/services/supabase';
import { calculateBMR, calculateTDEE, calculateSuggestedCalorie } from '../../src/utils/calculateMacro';
import { THEME } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userId, profile } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goalType, setGoalType] = useState('Giữ cân');

  // Load profile từ Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { data, error } = await getUserProfile(userId);
        if (data) {
          dispatch(setProfile(data));
          setFullName(data.full_name || '');
          setGender(data.gender || 'Nam');
          setAge(data.age ? String(data.age) : '25');
          setHeight(data.height ? String(data.height) : '170');
          setCurrentWeight(data.current_weight ? String(data.current_weight) : '65');
          setTargetWeight(data.target_weight ? String(data.target_weight) : '60');
          setGoalType(data.goal_type || 'Giữ cân');
        }
      } catch (err: any) {
        console.error('Lỗi tải profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, dispatch]);

  // Cập nhật thông tin profile
  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      const numWeight = parseFloat(currentWeight) || 60;
      const numHeight = parseFloat(height) || 165;
      const numAge = parseInt(age, 10) || 25;

      // Tính lại mục tiêu calo
      const bmr = calculateBMR(numWeight, numHeight, numAge, gender);
      const tdee = calculateTDEE(bmr);
      const newCalorieGoal = calculateSuggestedCalorie(tdee, goalType);

      const updates = {
        full_name: fullName.trim(),
        gender,
        age: numAge,
        height: numHeight,
        current_weight: numWeight,
        target_weight: parseFloat(targetWeight) || numWeight,
        goal_type: goalType,
        daily_calorie_goal: newCalorieGoal,
      };

      const { data, error } = await updateUserProfile(userId, updates);

      if (error) {
        Alert.alert('Lỗi cập nhật', error.message);
      } else if (data) {
        dispatch(setProfile(data));
        dispatch(setDailyCalorieGoal(newCalorieGoal));
        setIsEditing(false);
        Alert.alert('Thành công', 'Thông tin cá nhân đã được lưu cập nhật!');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  // Đăng xuất
  const handleSignOut = async () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Không thể đăng xuất', logSupabaseError('auth.signOut', error));
              return;
            }
            dispatch(clearAuth());
            router.replace('/login');
          } catch (error) {
            Alert.alert('Lỗi', logUnexpectedError('auth.signOut', error));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={THEME.colors.background}>
        <Spinner size="large" color={THEME.colors.primary} />
        <Text marginTop="$2" color={THEME.colors.textMuted}>
          Đang tải thông tin cá nhân...
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView
      backgroundColor={THEME.colors.background}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack padding="$4" gap="$4">
        {/* HEADER PROFILE */}
        <YStack
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$5"
          alignItems="center"
          borderWidth={1}
          borderColor={THEME.colors.border}
          gap="$2"
        >
          <View
            width={80}
            height={80}
            borderRadius={40}
            backgroundColor={THEME.colors.primaryLight}
            alignItems="center"
            justifyContent="center"
            marginBottom="$2"
          >
            <Text fontSize={36}>👤</Text>
          </View>

          <Text fontSize={20} fontWeight="800" color={THEME.colors.textMain}>
            {profile?.full_name || 'Người dùng'}
          </Text>

          <Text fontSize={13} color={THEME.colors.textMuted}>
            Mục tiêu: <Text fontWeight="700" color={THEME.colors.primary}>{profile?.goal_type || 'Theo dõi'}</Text>
          </Text>

          <View
            backgroundColor={THEME.colors.background}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius={THEME.radius.md}
            marginTop="$2"
          >
            <Text fontSize={13} fontWeight="600" color={THEME.colors.textMain}>
              Mức Calo chuẩn: <Text color={THEME.colors.calories} fontWeight="800">{profile?.daily_calorie_goal || 2000}</Text> kcal/ngày
            </Text>
          </View>
        </YStack>

        {/* THÔNG TIN CHI TIẾT */}
        <YStack
          backgroundColor={THEME.colors.card}
          borderRadius={THEME.radius.lg}
          padding="$4"
          borderWidth={1}
          borderColor={THEME.colors.border}
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
              Chỉ số thể chất
            </Text>

            <Button
              height={32}
              backgroundColor={isEditing ? THEME.colors.primaryLight : THEME.colors.background}
              borderWidth={1}
              borderColor={THEME.colors.border}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text fontSize={12} fontWeight="700" color={isEditing ? THEME.colors.primaryDark : THEME.colors.textMain}>
                {isEditing ? 'Hủy sửa' : '✏️ Chỉnh sửa'}
              </Text>
            </Button>
          </XStack>

          {isEditing ? (
            <YStack gap="$3" paddingTop="$2">
              <YStack gap="$1">
                <Text fontSize={12} color={THEME.colors.textMuted}>Họ và tên</Text>
                <Input value={fullName} onChangeText={setFullName} height={42} backgroundColor={THEME.colors.background} />
              </YStack>

              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color={THEME.colors.textMuted}>Tuổi</Text>
                  <Input value={age} onChangeText={setAge} keyboardType="numeric" height={42} backgroundColor={THEME.colors.background} />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color={THEME.colors.textMuted}>Chiều cao (cm)</Text>
                  <Input value={height} onChangeText={setHeight} keyboardType="numeric" height={42} backgroundColor={THEME.colors.background} />
                </YStack>
              </XStack>

              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color={THEME.colors.textMuted}>Cân nặng (kg)</Text>
                  <Input value={currentWeight} onChangeText={setCurrentWeight} keyboardType="numeric" height={42} backgroundColor={THEME.colors.background} />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Text fontSize={12} color={THEME.colors.textMuted}>Mục tiêu (kg)</Text>
                  <Input value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" height={42} backgroundColor={THEME.colors.background} />
                </YStack>
              </XStack>

              <Button
                backgroundColor={THEME.colors.primary}
                borderRadius={THEME.radius.md}
                marginTop="$2"
                disabled={saving}
                onPress={handleSaveProfile}
              >
                <Text fontSize={14} fontWeight="700" color="#FFFFFF">
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Text>
              </Button>
            </YStack>
          ) : (
            <YStack gap="$2" paddingTop="$2">
              <XStack justifyContent="space-between" paddingVertical="$2" borderBottomWidth={1} borderBottomColor={THEME.colors.borderLight}>
                <Text fontSize={14} color={THEME.colors.textMuted}>Giới tính</Text>
                <Text fontSize={14} fontWeight="700" color={THEME.colors.textMain}>{profile?.gender || 'Chưa cập nhật'}</Text>
              </XStack>

              <XStack justifyContent="space-between" paddingVertical="$2" borderBottomWidth={1} borderBottomColor={THEME.colors.borderLight}>
                <Text fontSize={14} color={THEME.colors.textMuted}>Tuổi</Text>
                <Text fontSize={14} fontWeight="700" color={THEME.colors.textMain}>{profile?.age || '--'} tuổi</Text>
              </XStack>

              <XStack justifyContent="space-between" paddingVertical="$2" borderBottomWidth={1} borderBottomColor={THEME.colors.borderLight}>
                <Text fontSize={14} color={THEME.colors.textMuted}>Chiều cao</Text>
                <Text fontSize={14} fontWeight="700" color={THEME.colors.textMain}>{profile?.height || '--'} cm</Text>
              </XStack>

              <XStack justifyContent="space-between" paddingVertical="$2" borderBottomWidth={1} borderBottomColor={THEME.colors.borderLight}>
                <Text fontSize={14} color={THEME.colors.textMuted}>Cân nặng hiện tại</Text>
                <Text fontSize={14} fontWeight="700" color={THEME.colors.primary}>{profile?.current_weight || '--'} kg</Text>
              </XStack>

              <XStack justifyContent="space-between" paddingVertical="$2">
                <Text fontSize={14} color={THEME.colors.textMuted}>Cân nặng mục tiêu</Text>
                <Text fontSize={14} fontWeight="700" color={THEME.colors.calories}>{profile?.target_weight || '--'} kg</Text>
              </XStack>
            </YStack>
          )}
        </YStack>

        {/* NÚT ĐĂNG XUẤT */}
        <Button
          backgroundColor="#FEE2E2"
          borderRadius={THEME.radius.md}
          borderWidth={1}
          borderColor="#FCA5A5"
          height={48}
          onPress={handleSignOut}
        >
          <Text fontSize={14} fontWeight="700" color={THEME.colors.danger}>
            🚪 Đăng Xuất
          </Text>
        </Button>
      </YStack>
    </ScrollView>
  );
}
