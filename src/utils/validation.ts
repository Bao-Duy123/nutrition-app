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
