import { Alert, Platform } from 'react-native';
import { getGlobalModal } from '../components/ModalProvider';

type AppAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * @deprecated Sử dụng hook `useAppModal()` thay thế trong components.
 * Giữ lại wrapper mỏng này để hỗ trợ các vị trí không thể dùng hook (ví dụ ngoài component) hoặc tương thích ngược.
 */
export const showAlert = (title: string, message: string, buttons?: AppAlertButton[]) => {
  const modal = getGlobalModal();
  if (modal) {
    if (buttons && buttons.length > 1) {
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
      void modal
        .confirm({
          title,
          message,
          cancelText: cancelBtn?.text || 'Hủy',
          confirmText: actionBtn?.text || 'Đồng ý',
          destructive: actionBtn?.style === 'destructive',
        })
        .then((ok) => {
          if (ok) {
            actionBtn?.onPress?.();
          } else {
            cancelBtn?.onPress?.();
          }
        });
      return;
    }

    const singleBtn = buttons?.[0];
    void modal
      .alert({
        title,
        message,
        confirmText: singleBtn?.text || 'Đã hiểu',
      })
      .then(() => {
        singleBtn?.onPress?.();
      });
    return;
  }

  // Fallback nếu ModalProvider chưa sẵn sàng
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const content = `${title}\n\n${message}`;
  if (buttons && buttons.length > 1) {
    if (globalThis.confirm(content)) {
      buttons[buttons.length - 1].onPress?.();
    }
    return;
  }

  globalThis.alert(content);
  buttons?.[0].onPress?.();
};
