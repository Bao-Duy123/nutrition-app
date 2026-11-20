import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, ScrollView, Spinner, View } from 'tamagui';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { setProfile as setAuthProfile, clearAuth } from '../../src/store/slices/authSlice';
import { setProfile as setStoreProfile, setProfileLoading, setProfileError, clearProfile } from '../../src/store/slices/profileSlice';
import { setDailyCalorieGoal, setTodayMeals } from '../../src/store/slices/dietSlice';
import { CONFIG } from '../../src/constants/config';
import { THEME } from '../../src/constants/theme';
import { Profile } from '../../src/types/database';
import { deleteCurrentUserAccount, getProfile } from '../../src/services/profileService';
import { supabase, logSupabaseError, logUnexpectedError } from '../../src/services/supabase';
import { useAppModal } from '../../src/components/ModalProvider';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileMenuList } from './profile/ProfileMenuList';
import { EditProfileModal } from './profile/EditProfileModal';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const modal = useAppModal();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = width >= 700 ? 32 : width < 360 ? 12 : 16;

  // Lấy session & user từ Redux store (hoặc fallback auth)
  const { session, userId: authUserId } = useAppSelector((state) => state.auth);
  const { profile, isLoading, error: profileError } = useAppSelector((state) => state.profile);

  // Email lấy từ auth session (không lấy từ bảng profiles)
  const userEmail = session?.user?.email || null;

  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Hàm tải dữ liệu hồ sơ từ Supabase
  const loadProfile = useCallback(
    async (isManualRefresh = false) => {
      // Xác định userId hiện tại từ auth session
      let currentUserId = authUserId;
      if (!currentUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData.session?.user?.id || null;
      }

      if (!currentUserId) {
        dispatch(setProfileLoading(false));
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        dispatch(setProfileLoading(true));
      }

      try {
        const { data, error } = await getProfile(currentUserId);

        if (error) {
          const formattedMsg =
            typeof error === 'object' && error?.message
              ? error.message
              : 'Không thể tải thông tin hồ sơ.';
          dispatch(setProfileError(formattedMsg));
        } else {
          dispatch(setStoreProfile(data));
          if (data) {
            dispatch(setAuthProfile(data));
            if (data.daily_calorie_goal) {
              dispatch(setDailyCalorieGoal(data.daily_calorie_goal));
            }
          }
        }
      } catch (err: any) {
        const msg = err.message || 'Lỗi kết nối khi tải hồ sơ.';
        dispatch(setProfileError(msg));
      } finally {
        if (isManualRefresh) {
          setRefreshing(false);
        } else {
          dispatch(setProfileLoading(false));
        }
      }
    },
    [authUserId, dispatch]
  );

  // Tự động load dữ liệu khi component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    loadProfile(true);
  }, [loadProfile]);

  // Cập nhật khi sửa thành công trong modal
  const handleUpdateSuccess = (updatedProfile: Profile) => {
    dispatch(setStoreProfile(updatedProfile));
    dispatch(setAuthProfile(updatedProfile));
    if (updatedProfile.daily_calorie_goal) {
      dispatch(setDailyCalorieGoal(updatedProfile.daily_calorie_goal));
    }
  };

  // Đăng xuất khỏi Supabase Auth và xóa toàn bộ state
  const handleSignOut = async () => {
    const ok = await modal.confirm({
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy',
      destructive: true,
    });

    if (!ok) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        void modal.alert({
          type: 'error',
          title: 'Không thể đăng xuất',
          message: logSupabaseError('auth.signOut', error),
        });
        return;
      }

      // Xóa state trong toàn bộ store
      dispatch(clearAuth());
      dispatch(clearProfile());
      dispatch(setTodayMeals([]));
      dispatch(setDailyCalorieGoal(CONFIG.DEFAULT_DAILY_CALORIE_GOAL));

      // Chuyển hướng về trang đăng nhập
      router.replace('/login');
    } catch (error) {
      void modal.alert({
        type: 'error',
        title: 'Lỗi',
        message: logUnexpectedError('auth.signOut', error),
      });
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await modal.confirm({
      title: 'Xóa tài khoản?',
      message: 'Thao tác này sẽ xóa tài khoản và dữ liệu liên quan. Bạn có chắc chắn muốn tiếp tục không?',
      confirmText: 'Xóa tài khoản',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!ok) return;

    try {
      setIsDeletingAccount(true);
      const { error } = await deleteCurrentUserAccount();
      if (error) {
        void modal.alert({
          type: 'error',
          title: 'Chưa thể xóa tài khoản',
          message:
            error.code === '42883'
              ? 'Backend Supabase chưa triển khai RPC xóa tài khoản. Vui lòng thử lại sau khi hoàn tất phần backend.'
              : error.message || 'Vui lòng thử lại sau.',
        });
        return;
      }

      // RPC đã xóa user; signOut chỉ dọn session local, lỗi ở đây không được chặn việc reset store.
      await supabase.auth.signOut().catch((signOutError) => {
        logUnexpectedError('auth.signOutAfterAccountDeletion', signOutError);
      });
      dispatch(clearAuth());
      dispatch(clearProfile());
      dispatch(setTodayMeals([]));
      dispatch(setDailyCalorieGoal(CONFIG.DEFAULT_DAILY_CALORIE_GOAL));
      router.replace('/login');
    } catch (error) {
      void modal.alert({
        type: 'error',
        title: 'Không thể xóa tài khoản',
        message: logUnexpectedError('profile.deleteAccount', error),
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // 1. TRẠNG THÁI ĐANG TẢI (LOADING STATE)
  if (isLoading && !profile && !refreshing) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={THEME.colors.background} gap="$3">
        <Spinner size="large" color={THEME.colors.primary} />
        <Text fontSize={14} color={THEME.colors.textMuted} fontWeight="500">
          Đang tải thông tin cá nhân...
        </Text>
      </YStack>
    );
  }

  // 2. TRẠNG THÁI LỖI (ERROR STATE)
  if (profileError && !profile && !refreshing) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" backgroundColor={THEME.colors.background} gap="$4">
        <Text fontSize={48}>⚠️</Text>
        <Text fontSize={18} fontWeight="800" color={THEME.colors.textMain} textAlign="center">
          Không thể tải dữ liệu hồ sơ
        </Text>
        <Text fontSize={13} color={THEME.colors.textMuted} textAlign="center">
          {profileError}
        </Text>
        <Button
          backgroundColor={THEME.colors.primary}
          borderRadius={THEME.radius.md}
          paddingHorizontal="$5"
          height={44}
          onPress={() => loadProfile()}
        >
          <Text fontSize={14} fontWeight="700" color="#FFFFFF">
            Thử lại
          </Text>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={THEME.colors.background}>
      {/* TOP HEADER BAR (Khớp với hình mẫu docs/ui/06-profile/profile.png) */}
      <XStack
        width="100%"
        maxWidth={640}
        alignSelf="center"
        paddingHorizontal={horizontalPadding}
        paddingTop={Math.max(insets.top, 12)}
        paddingBottom="$3"
        backgroundColor={THEME.colors.background}
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" gap="$2.5">
          <View
            width={38}
            height={38}
            borderRadius={19}
            backgroundColor="#E8EEFF"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={18}>🔥</Text>
          </View>
          <Text fontSize={20} fontWeight="800" color={THEME.colors.textMain}>
            Cá Nhân
          </Text>
        </XStack>

        <XStack alignItems="center" gap="$2.5">
          {/* Nút thông báo */}
          <View
            width={38}
            height={38}
            borderRadius={19}
            backgroundColor={THEME.colors.card}
            borderWidth={1}
            borderColor={THEME.colors.borderLight}
            alignItems="center"
            justifyContent="center"
            onPress={() =>
              void modal.alert({
                type: 'info',
                title: 'Thông báo',
                message: 'Bạn không có thông báo mới.',
              })
            }
            cursor="pointer"
          >
            <Text fontSize={17}>🔔</Text>
          </View>

          {/* Nút profile user */}
          <View
            width={38}
            height={38}
            borderRadius={19}
            backgroundColor={THEME.colors.primary}
            alignItems="center"
            justifyContent="center"
            onPress={() => setIsEditModalOpen(true)}
            cursor="pointer"
          >
            <Text fontSize={16} color="#FFFFFF">
              👤
            </Text>
          </View>
        </XStack>
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: Math.max(insets.bottom + 76, 40),
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.primary]}
            tintColor={THEME.colors.primary}
          />
        }
      >
        <YStack width="100%" maxWidth={640} alignSelf="center" gap="$4">
          {/* 3. TRẠNG THÁI RỖNG (EMPTY STATE - nếu chưa có bản ghi profile) */}
          {!profile ? (
            <YStack
              backgroundColor={THEME.colors.card}
              padding="$6"
              borderRadius={THEME.radius.lg}
              borderWidth={1}
              borderColor={THEME.colors.borderLight}
              alignItems="center"
              gap="$3"
            >
              <Text fontSize={42}>📝</Text>
              <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain}>
                Chưa có thông tin hồ sơ
              </Text>
              <Text fontSize={13} color={THEME.colors.textMuted} textAlign="center">
                Hãy hoàn tất hồ sơ cá nhân để tính toán mục tiêu dinh dưỡng chính xác nhất.
              </Text>
              <Button
                backgroundColor={THEME.colors.primary}
                borderRadius={THEME.radius.md}
                paddingHorizontal="$4"
                height={42}
                onPress={() => setIsEditModalOpen(true)}
              >
                <Text fontSize={14} fontWeight="700" color="#FFFFFF">
                  + Thiết lập hồ sơ ngay
                </Text>
              </Button>
            </YStack>
          ) : (
            <>
              {/* PROFILE HEADER (Avatar, Họ tên, ID, Email từ Auth, Badge, BMR, TDEE) */}
              <ProfileHeader
                profile={profile}
                email={userEmail}
                onEditAvatar={() => setIsEditModalOpen(true)}
              />

              {/* MENU ITEMS (Hồ sơ sức khỏe, Thông số cơ thể, Nhắc nhở, Đổi mật khẩu) */}
              <ProfileMenuList
                profile={profile}
                onPressHealthProfile={() => setIsEditModalOpen(true)}
                onPressBodyStats={() => setIsEditModalOpen(true)}
                onPressReminders={() =>
                  void modal.alert({
                    type: 'info',
                    title: 'Nhắc nhở',
                    message: 'Tính năng nhắc nhở bữa ăn đang được kích hoạt.',
                  })
                }
                onPressChangePassword={() => router.push('/security')}
              />
            </>
          )}

          {/* NÚT ĐĂNG XUẤT (Nút màu đỏ dạng pill bo tròn theo thiết kế profile.png) */}
          <Button
            backgroundColor="#C5221F"
            borderRadius={THEME.radius.full}
            height={52}
            onPress={handleSignOut}
            shadowColor="#C5221F"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.25}
            shadowRadius={8}
            marginTop="$2"
          >
            <XStack alignItems="center" justifyContent="center" gap="$2">
              <Text fontSize={17} color="#FFFFFF">
                🚪
              </Text>
              <Text fontSize={16} fontWeight="800" color="#FFFFFF">
                Đăng xuất
              </Text>
            </XStack>
          </Button>

          <Button
            backgroundColor="transparent"
            borderWidth={1}
            borderColor={THEME.colors.danger}
            borderRadius={THEME.radius.full}
            height={48}
            disabled={isDeletingAccount}
            opacity={isDeletingAccount ? 0.6 : 1}
            onPress={handleDeleteAccount}
          >
            <Text fontSize={14} fontWeight="700" color={THEME.colors.danger}>
              {isDeletingAccount ? 'Đang xử lý...' : 'Xóa tài khoản'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>

      {/* MODAL CHỈNH SỬA THÔNG TIN CÁ NHÂN & THÔNG SỐ CƠ THỂ */}
      <EditProfileModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        userId={authUserId || session?.user?.id || ''}
        onSuccess={handleUpdateSuccess}
      />
    </YStack>
  );
}
