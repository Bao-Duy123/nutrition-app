import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Spinner,
  View,
} from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../src/constants/theme';
import { useAppSelector } from '../src/store';
import { authService } from '../src/services/authService';
import { useAppModal } from '../src/components/ModalProvider';
import { TextInput } from 'react-native';

// Giới hạn chiều rộng để màn hình không bị giãn khi xem trên web / tablet
const MAX_WIDTH = 480;
const SUCCESS_COLOR = '#16A34A';

/* ---------- Ô nhập mật khẩu: mặc định ẩn (••••), bấm "Hiện" để xem ---------- */
type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  inputRef?: React.RefObject<any>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
  textContentType?: 'password' | 'newPassword';
  autoComplete?: 'current-password' | 'new-password';
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  inputRef,
  onSubmitEditing,
  returnKeyType = 'next',
  textContentType = 'password',
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <YStack gap="$1.5">
      <Text fontSize={13} fontWeight="600" color={THEME.colors.textMain}>
        {label}
      </Text>
      <XStack
        alignItems="center"
        borderWidth={1}
        borderColor={focused ? THEME.colors.primary : THEME.colors.border}
        borderRadius={THEME.radius.md}
        backgroundColor="#FFFFFF"
        paddingLeft="$3"
        height={50}
      >
      <TextInput
      ref={inputRef}
      secureTextEntry={!visible}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={THEME.colors.textLight}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={textContentType}
      autoComplete={autoComplete}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        flex: 1,
        height: 48,
        fontSize: 15,
        borderWidth: 0,
        backgroundColor: 'transparent',
        color: THEME.colors.textMain,
      }}
    />
        <Button
          backgroundColor="transparent"
          borderWidth={0}
          minWidth={56}
          height={50}
          alignItems="center"
          justifyContent="center"
          onPress={() => setVisible((prev) => !prev)}
        >
          <Text fontSize={13} fontWeight="600" color={THEME.colors.primary}>
            {visible ? 'Ẩn' : 'Hiện'}
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}

/* ---------- Một dòng điều kiện (tick xanh khi đạt) ---------- */
function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <XStack alignItems="center" gap="$2">
      <Text
        fontSize={13}
        fontWeight="700"
        width={16}
        color={ok ? SUCCESS_COLOR : THEME.colors.textLight}
      >
        {ok ? '✓' : '○'}
      </Text>
      <Text
        fontSize={13}
        flex={1}
        color={ok ? SUCCESS_COLOR : THEME.colors.textMuted}
      >
        {text}
      </Text>
    </XStack>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const modal = useAppModal();
  const { session, profile } = useAppSelector((state) => state.auth);

  // Form input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Chuyển focus giữa các ô khi bấm "Tiếp" trên bàn phím
  const newPasswordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  // Kiểm tra tài khoản có phải login qua email provider không
  const provider = session?.user?.app_metadata?.provider;
  const isEmailProvider = !provider || provider === 'email';

  // Thông tin user hiển thị trên header card
  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Người dùng';
  const displayEmail = session?.user?.email || 'Chưa có email';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'U';

  // Trạng thái các điều kiện (hiển thị trực tiếp khi gõ)
  const lengthOk = newPassword.length >= 6;
  const differentOk = newPassword.length > 0 && newPassword !== currentPassword;
  const matchOk = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSubmit = currentPassword.length > 0 && lengthOk && differentOk && matchOk;

  const handleChangePassword = async () => {
    // 1. Kiểm tra rỗng
    if (!currentPassword) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Vui lòng nhập mật khẩu hiện tại.',
      });
      return;
    }
    if (!newPassword) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Vui lòng nhập mật khẩu mới.',
      });
      return;
    }
    if (!confirmPassword) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Vui lòng xác nhận mật khẩu mới.',
      });
      return;
    }

    // 2. Validation: new password ít nhất 6 ký tự
    if (newPassword.length < 6) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
      return;
    }

    // 3. Validation: new password khác current password
    if (newPassword === currentPassword) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      });
      return;
    }

    // 4. Validation: confirm must match
    if (newPassword !== confirmPassword) {
      void modal.alert({
        type: 'warning',
        title: 'Lỗi',
        message: 'Mật khẩu xác nhận không trùng khớp.',
      });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      const { error } = await authService.changePassword(currentPassword, newPassword);

      if (error) {
        void modal.alert({
          type: 'error',
          title: 'Đổi mật khẩu thất bại',
          message: error.message,
        });
        return;
      }

      // Success
      void modal
        .alert({
          type: 'success',
          title: 'Thành công',
          message: 'Đổi mật khẩu thành công',
          confirmText: 'OK',
        })
        .then(() => {
          router.back();
        });
    } catch (err: any) {
      void modal.alert({
        type: 'error',
        title: 'Lỗi',
        message: err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Khung nội dung giới hạn chiều rộng, căn giữa */}
        <YStack flex={1} width="100%" maxWidth={MAX_WIDTH} alignSelf="center">
          {/* TOP BAR */}
          <XStack
            paddingRight="$4"
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor={THEME.colors.borderLight}
            backgroundColor={THEME.colors.card}
          >
            <Button
              backgroundColor="transparent"
              borderWidth={0}
              height={52}
              paddingHorizontal="$4"
              flexDirection="row"
              alignItems="center"
              gap="$2"
              onPress={() => router.back()}
            >
              <Text fontSize={22} fontWeight="700" color={THEME.colors.textMain}>
                ‹
              </Text>
              <Text fontSize={17} fontWeight="700" color={THEME.colors.textMain}>
                Bảo mật tài khoản
              </Text>
            </Button>
          </XStack>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <YStack gap="$4">
              {/* USER INFO CARD */}
              <XStack
                backgroundColor={THEME.colors.card}
                padding="$3.5"
                borderRadius={THEME.radius.lg}
                borderWidth={1}
                borderColor={THEME.colors.borderLight}
                alignItems="center"
                gap="$3"
              >
                <View
                  width={46}
                  height={46}
                  borderRadius={23}
                  backgroundColor="#E8EEFF"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={16} fontWeight="800" color={THEME.colors.primary}>
                    {avatarInitials}
                  </Text>
                </View>

                <YStack flex={1} gap="$0.5">
                  <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text fontSize={13} color={THEME.colors.textMuted} numberOfLines={1}>
                    {displayEmail}
                  </Text>
                </YStack>

                <View
                  width={36}
                  height={36}
                  borderRadius={18}
                  backgroundColor="#F1F5F9"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={16}>🛡️</Text>
                </View>
              </XStack>

              {/* FORM HOẶC THÔNG BÁO TÀI KHOẢN OAUTH */}
              {!isEmailProvider ? (
                <YStack
                  backgroundColor={THEME.colors.card}
                  padding="$5"
                  borderRadius={THEME.radius.lg}
                  borderWidth={1}
                  borderColor={THEME.colors.borderLight}
                  alignItems="center"
                  gap="$3"
                >
                  <View
                    width={56}
                    height={56}
                    borderRadius={28}
                    backgroundColor="#EFF6FF"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={26}>ℹ️</Text>
                  </View>
                  <Text fontSize={16} fontWeight="700" color={THEME.colors.textMain} textAlign="center">
                    Tài khoản đăng nhập mạng xã hội không thêm đổi mật khẩu
                  </Text>

                  <Button
                    backgroundColor="#F1F5F9"
                    borderRadius={THEME.radius.md}
                    height={46}
                    paddingHorizontal="$5"
                    onPress={() => router.back()}
                    marginTop="$2"
                  >
                    <Text fontSize={14} fontWeight="600" color={THEME.colors.textMain}>
                      Quay lại
                    </Text>
                  </Button>
                </YStack>
              ) : (
                <YStack
                  backgroundColor={THEME.colors.card}
                  padding="$4"
                  borderRadius={THEME.radius.lg}
                  borderWidth={1}
                  borderColor={THEME.colors.borderLight}
                  gap="$3.5"
                >
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={18}>🔒</Text>
                    <Text fontSize={16} fontWeight="800" color={THEME.colors.textMain}>
                      Đổi mật khẩu
                    </Text>
                  </XStack>

                  <PasswordField
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Nhập mật khẩu hiện tại"
                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                    textContentType="password"
                    autoComplete="current-password"
                  />

                  <PasswordField
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Tối thiểu 6 ký tự"
                    inputRef={newPasswordRef}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />

                  <PasswordField
                    label="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    inputRef={confirmPasswordRef}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />

                  {/* Điều kiện mật khẩu: gọn, tick xanh khi đạt */}
                  <YStack
                    backgroundColor="#F8FAFC"
                    borderRadius={THEME.radius.md}
                    padding="$3"
                    gap="$1.5"
                  >
                    <Rule ok={lengthOk} text="Ít nhất 6 ký tự" />
                    <Rule ok={differentOk} text="Khác mật khẩu hiện tại" />
                    <Rule ok={matchOk} text="Xác nhận trùng với mật khẩu mới" />
                  </YStack>

                  <Button
                    backgroundColor={THEME.colors.primary}
                    borderRadius={THEME.radius.md}
                    height={50}
                    disabled={loading || !canSubmit}
                    opacity={loading || !canSubmit ? 0.5 : 1}
                    onPress={handleChangePassword}
                  >
                    {loading ? (
                      <Spinner size="small" color="#FFFFFF" />
                    ) : (
                      <Text fontSize={15} fontWeight="700" color="#FFFFFF">
                        Cập nhật mật khẩu
                      </Text>
                    )}
                  </Button>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
