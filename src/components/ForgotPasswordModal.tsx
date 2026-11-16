import React, { useState, useEffect, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AppModal } from './AppModal';
import { useAppModal } from './ModalProvider';
import { THEME } from '../constants/theme';
import { supabase, logSupabaseError, logUnexpectedError } from '../services/supabase';
import { isValidEmail, validatePassword, maskEmail } from '../utils/validation';

export interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = 1 | 2 | 3;

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  initialEmail = '',
}) => {
  const modal = useAppModal();

  // Form states
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // OTP state (6 chữ số)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Mật khẩu mới states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Refs cho các ô OTP
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Khởi tạo email khi modal mở
  useEffect(() => {
    if (visible) {
      setEmail(initialEmail.trim().toLowerCase());
      setStep(1);
      setEmailError('');
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setCountdown(0);
    }
  }, [visible, initialEmail]);

  // Tự động focus ô OTP đầu tiên khi sang Bước 2
  useEffect(() => {
    if (visible && step === 2) {
      const focusTimer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 250);
      return () => clearTimeout(focusTimer);
    }
  }, [visible, step]);

  // Bộ đếm ngược 60 giây gửi lại OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Xử lý đóng modal an toàn
  const handleClose = async () => {
    if (step === 3) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        logUnexpectedError('forgotPassword.cleanupSession', err);
      }
    }

    setStep(1);
    setEmail('');
    setEmailError('');
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setCountdown(0);
    setLoading(false);

    onClose();
  };

  // ==========================================
  // BƯỚC 1: NHẬP VÀ KIỂM TRA EMAIL, GỬI OTP
  // ==========================================
  const handleSendEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setEmailError('');

    if (!normalizedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Định dạng email không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const { data: exists, error: rpcError } = await supabase.rpc('email_exists', {
        p_email: normalizedEmail,
      });

      if (rpcError) {
        logSupabaseError('forgotPassword.email_exists', rpcError);
        setEmailError('Không thể kiểm tra tài khoản. Vui lòng thử lại sau.');
        return;
      }

      if (!exists) {
        setEmailError('Email chưa được đăng ký trong hệ thống.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (resetError) {
        logSupabaseError('forgotPassword.resetPasswordForEmail', resetError);
        const msg = (resetError.message || '').toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many')) {
          setEmailError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ ít phút.');
        } else {
          setEmailError('Không thể gửi mã xác nhận. Vui lòng thử lại.');
        }
        return;
      }

      setStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    } catch (err: any) {
      logUnexpectedError('forgotPassword.sendEmail', err);
      setEmailError('Lỗi kết nối. Vui lòng kiểm tra đường truyền mạng.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setOtpError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        logSupabaseError('forgotPassword.resendOtp', error);
        setOtpError('Không thể gửi lại mã. Vui lòng thử lại sau.');
      } else {
        setCountdown(60);
        void modal.alert({
          type: 'success',
          title: 'Đã gửi lại mã',
          message: 'Mã xác nhận 6 số mới đã được gửi tới hộp thư của bạn.',
        });
      }
    } catch (err) {
      logUnexpectedError('forgotPassword.resendOtp', err);
      setOtpError('Lỗi kết nối mạng khi gửi lại mã.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BƯỚC 2: NHẬP VÀ XÁC THỰC OTP 6 SỐ
  // ==========================================
  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });
      setOtp(newOtp);
      setOtpError('');

      const nextIndex = Math.min(digits.length - 1, 5);
      otpInputRefs.current[nextIndex]?.focus();

      if (digits.length === 6) {
        void verifyOtpToken(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setOtpError('');

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (cleaned && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && !fullCode.includes('')) {
        void verifyOtpToken(fullCode);
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtpToken = async (tokenCode: string) => {
    if (tokenCode.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số xác nhận.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setOtpError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: tokenCode,
        type: 'recovery',
      });

      if (error) {
        logSupabaseError('forgotPassword.verifyOtp', error);
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('expired') || msg.includes('hết hạn')) {
          setOtpError('Mã xác nhận đã hết hạn. Vui lòng bấm "Gửi lại mã".');
        } else if (msg.includes('invalid') || msg.includes('token')) {
          setOtpError('Mã xác nhận không chính xác. Vui lòng kiểm tra lại.');
        } else {
          setOtpError('Xác thực mã thất bại. Vui lòng thử lại.');
        }
        return;
      }

      if (!data.session) {
        setOtpError('Không tạo được phiên khôi phục. Vui lòng thử lại.');
        return;
      }

      setStep(3);
    } catch (err: any) {
      logUnexpectedError('forgotPassword.verifyOtp', err);
      setOtpError('Lỗi kết nối khi xác thực mã.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BƯỚC 3: ĐẶT MẬT KHẨU MỚI
  // ==========================================
  const handleUpdatePassword = async () => {
    setPasswordError('');

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    const valResult = validatePassword(password);
    if (!valResult.isValid) {
      setPasswordError(valResult.message || 'Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }

    if (!confirmPassword) {
      setPasswordError('Vui lòng xác nhận mật khẩu mới.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        logSupabaseError('forgotPassword.updateUser', error);
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('same_password') || msg.includes('different from')) {
          setPasswordError('Mật khẩu mới phải khác mật khẩu trước đây.');
        } else if (msg.includes('weak') || msg.includes('least')) {
          setPasswordError('Mật khẩu chưa đáp ứng yêu cầu độ dài an toàn.');
        } else {
          setPasswordError(error.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
        }
        return;
      }

      await supabase.auth.signOut();

      onClose();
      setStep(1);
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setPassword('');
      setConfirmPassword('');

      void modal.alert({
        type: 'success',
        title: 'Thành công',
        message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
        confirmText: 'Đăng nhập ngay',
      });
    } catch (err: any) {
      logUnexpectedError('forgotPassword.updatePassword', err);
      setPasswordError('Lỗi kết nối khi cập nhật mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      dismissable={!loading}
      maxWidth={400}
      title={
        step === 1
          ? 'Quên mật khẩu'
          : step === 2
          ? 'Xác nhận mã OTP'
          : 'Đặt lại mật khẩu mới'
      }
    >
      {/* Thanh tiến trình 3 bước */}
      <View style={styles.stepBarRow}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.stepBarItem,
              {
                backgroundColor:
                  s <= step ? THEME.colors.primary : THEME.colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* ========================================================= */}
      {/* BƯỚC 1: FORM NHẬP EMAIL                                   */}
      {/* ========================================================= */}
      {step === 1 && (
        <View style={styles.section}>
          <Text style={[styles.description, { color: THEME.colors.textMuted }]}>
            Nhập email tài khoản của bạn để nhận mã xác nhận gồm 6 chữ số đặt lại mật khẩu.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: THEME.colors.textMain }]}>
              Địa chỉ email
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  borderColor: emailError ? THEME.colors.danger : THEME.colors.border,
                  borderRadius: THEME.radius.md,
                },
              ]}
            >
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                placeholder="vidu@gmail.com"
                placeholderTextColor={THEME.colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={handleSendEmail}
                style={[styles.input, { color: THEME.colors.textMain }]}
              />
            </View>
            {emailError ? (
              <Text style={[styles.errorText, { color: THEME.colors.danger }]}>
                {emailError}
              </Text>
            ) : null}
          </View>

          <Pressable
            disabled={loading}
            onPress={handleSendEmail}
            accessibilityRole="button"
            accessibilityLabel="Gửi mã xác nhận"
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: THEME.colors.primary,
                borderRadius: THEME.radius.md,
                opacity: loading ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Gửi mã xác nhận</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* ========================================================= */}
      {/* BƯỚC 2: FORM NHẬP OTP 6 SỐ                                */}
      {/* ========================================================= */}
      {step === 2 && (
        <View style={styles.section}>
          <View>
            <Text style={[styles.description, { color: THEME.colors.textMuted }]}>
              Mã xác nhận 6 số đã được gửi tới:
            </Text>
            <View style={styles.emailRow}>
              <Text style={[styles.maskedEmail, { color: THEME.colors.textMain }]}>
                {maskEmail(email)}
              </Text>
              <Pressable
                disabled={loading}
                onPress={() => {
                  setStep(1);
                  setOtpError('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Đổi email"
              >
                <Text style={[styles.linkText, { color: THEME.colors.primary }]}>
                  Đổi email
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 6 ô nhập mã OTP */}
          <View style={styles.fieldGroup}>
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    {
                      borderRadius: THEME.radius.md,
                      borderColor: otpError
                        ? THEME.colors.danger
                        : digit
                        ? THEME.colors.primary
                        : THEME.colors.border,
                      backgroundColor: digit ? '#F0F7FF' : '#F9FAFB',
                    },
                  ]}
                >
                  <TextInput
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    value={digit}
                    onChangeText={(txt) => handleOtpChange(txt, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={idx === 0 ? 6 : 1}
                    selectTextOnFocus
                    editable={!loading}
                    textAlign="center"
                    style={[styles.otpInput, { color: THEME.colors.textMain }]}
                  />
                </View>
              ))}
            </View>

            {otpError ? (
              <Text style={[styles.errorText, { color: THEME.colors.danger }]}>
                {otpError}
              </Text>
            ) : null}
          </View>

          <Pressable
            disabled={loading}
            onPress={() => verifyOtpToken(otp.join(''))}
            accessibilityRole="button"
            accessibilityLabel="Xác nhận mã OTP"
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: THEME.colors.primary,
                borderRadius: THEME.radius.md,
                opacity: loading ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Xác nhận mã</Text>
            )}
          </Pressable>

          {/* Gửi lại mã */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: THEME.colors.textMuted }]}>
              Chưa nhận được mã?{' '}
            </Text>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: THEME.colors.textLight }]}>
                Gửi lại sau ({countdown}s)
              </Text>
            ) : (
              <Pressable
                disabled={loading}
                onPress={handleResendOtp}
                accessibilityRole="button"
                accessibilityLabel="Gửi lại mã"
              >
                <Text style={[styles.linkText, { color: THEME.colors.primary }]}>
                  Gửi lại mã
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* BƯỚC 3: FORM ĐẶT MẬT KHẨU MỚI                             */}
      {/* ========================================================= */}
      {step === 3 && (
        <View style={styles.section}>
          <Text style={[styles.description, { color: THEME.colors.textMuted }]}>
            Xác thực thành công. Vui lòng thiết lập mật khẩu mới (ít nhất 8 ký tự).
          </Text>

          {/* Mật khẩu mới */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: THEME.colors.textMain }]}>
              Mật khẩu mới
            </Text>
            <View
              style={[
                styles.passwordBox,
                {
                  borderColor: passwordError ? THEME.colors.danger : THEME.colors.border,
                  borderRadius: THEME.radius.md,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={THEME.colors.textLight}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={[styles.passwordInput, { color: THEME.colors.textMain }]}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={styles.eyeBtn}
              >
                <Text style={[styles.eyeText, { color: THEME.colors.primary }]}>
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Xác nhận mật khẩu */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: THEME.colors.textMain }]}>
              Xác nhận mật khẩu mới
            </Text>
            <View
              style={[
                styles.passwordBox,
                {
                  borderColor: passwordError ? THEME.colors.danger : THEME.colors.border,
                  borderRadius: THEME.radius.md,
                },
              ]}
            >
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setPasswordError('');
                }}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={THEME.colors.textLight}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleUpdatePassword}
                style={[styles.passwordInput, { color: THEME.colors.textMain }]}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={styles.eyeBtn}
              >
                <Text style={[styles.eyeText, { color: THEME.colors.primary }]}>
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </Pressable>
            </View>

            {passwordError ? (
              <Text style={[styles.errorText, { color: THEME.colors.danger }]}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          <Pressable
            disabled={loading}
            onPress={handleUpdatePassword}
            accessibilityRole="button"
            accessibilityLabel="Cập nhật mật khẩu"
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: THEME.colors.primary,
                borderRadius: THEME.radius.md,
                opacity: loading ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Lưu mật khẩu & Đăng nhập</Text>
            )}
          </Pressable>
        </View>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  stepBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  stepBarItem: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  section: {
    gap: 14,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  inputBox: {
    borderWidth: 1.5,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    height: '100%',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  primaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  maskedEmail: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 19,
    fontWeight: '700',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    paddingVertical: 0,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  resendLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: '#F9FAFB',
    paddingLeft: 14,
    paddingRight: 6,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});