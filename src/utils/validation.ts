/**
 * Validation helpers dùng chung cho authentication
 */

export const isValidEmail = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
  checks: {
    minLength: boolean; // Ít nhất 8 ký tự
  };
}

/**
 * Kiểm tra mật khẩu theo đúng tiêu chuẩn của màn hình đăng ký (ít nhất 8 ký tự)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const minLength = password.length >= 8;
  const isValid = minLength;

  return {
    isValid,
    message: isValid ? undefined : 'Mật khẩu cần có ít nhất 8 ký tự.',
    checks: {
      minLength,
    },
  };
};

/**
 * Che một phần địa chỉ email để bảo mật khi gửi OTP:
 * ví dụ: user.example@gmail.com -> u***e@gmail.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0] || '*'}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

/**
 * Kiểm tra xem hồ sơ người dùng đã hoàn thành onboarding/nhập thông số sức khỏe bắt buộc chưa.
 * Các thông tin bắt buộc: age (>=13), height (>0), current_weight (>0), target_weight (>0).
 */
export const isProfileOnboarded = (profile: {
  age?: number | null;
  height?: number | null;
  current_weight?: number | null;
  target_weight?: number | null;
} | null | undefined): boolean => {
  if (!profile) return false;
  const { age, height, current_weight, target_weight } = profile;
  return (
    typeof age === 'number' &&
    Number.isFinite(age) &&
    age >= 13 &&
    typeof height === 'number' &&
    Number.isFinite(height) &&
    height > 0 &&
    typeof current_weight === 'number' &&
    Number.isFinite(current_weight) &&
    current_weight > 0 &&
    typeof target_weight === 'number' &&
    Number.isFinite(target_weight) &&
    target_weight > 0
  );
};

