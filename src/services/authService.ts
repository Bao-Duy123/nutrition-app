import { supabase } from './supabase';

export interface AuthServiceResponse<T = void> {
  data: T | null;
  error: {
    message: string;
    originalError?: any;
  } | null;
}

export const mapAuthErrorToVietnamese = (error: any): string => {
  if (!error) return 'Đã xảy ra lỗi không xác định.';
  const message = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid_credentials') ||
    code === 'invalid_credentials'
  ) {
    return 'Mật khẩu hiện tại không đúng';
  }

  if (
    message.includes('password should be at least') ||
    message.includes('weak_password') ||
    code === 'weak_password'
  ) {
    return 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  }

  if (message.includes('same_password') || message.includes('new password should be different')) {
    return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại mạng Internet.';
  }

  if (message.includes('too many requests') || message.includes('over_email_send_rate_limit')) {
    return 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
  }

  return error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại sau.';
};

export const authService = {
  /**
   * Đổi mật khẩu tài khoản người dùng:
   * 1) Lấy email từ auth session hiện tại;
   * 2) Xác thực lại mật khẩu hiện tại bằng signInWithPassword;
   * 3) Cập nhật mật khẩu mới bằng updateUser({ password: next }).
   * Tuyệt đối không log hoặc lưu mật khẩu.
   */
  async changePassword(current: string, next: string): Promise<AuthServiceResponse<void>> {
    try {
      // 1. Kiểm tra session hiện tại và lấy email
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        return {
          data: null,
          error: {
            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            originalError: sessionError,
          },
        };
      }

      const email = session.user.email;
      if (!email) {
        return {
          data: null,
          error: {
            message: 'Không tìm thấy địa chỉ email của tài khoản.',
          },
        };
      }

      // Kiểm tra provider
      const provider = session.user.app_metadata?.provider;
      if (provider && provider !== 'email') {
        return {
          data: null,
          error: {
            message: 'Tài khoản đăng nhập qua bên thứ ba (Google/Apple...) không sử dụng mật khẩu.',
          },
        };
      }

      // 2. Xác thực lại mật khẩu hiện tại
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });

      if (signInError) {
        return {
          data: null,
          error: {
            message: 'Mật khẩu hiện tại không đúng',
            originalError: signInError,
          },
        };
      }

      // 3. Cập nhật mật khẩu mới
      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
      });

      if (updateError) {
        return {
          data: null,
          error: {
            message: mapAuthErrorToVietnamese(updateError),
            originalError: updateError,
          },
        };
      }

      return { data: null, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          message: mapAuthErrorToVietnamese(err),
          originalError: err,
        },
      };
    }
  },
};
