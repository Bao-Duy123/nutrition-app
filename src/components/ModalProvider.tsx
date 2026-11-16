import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppModal } from './AppModal';
import { THEME } from '../constants/theme';

export type ModalType = 'info' | 'success' | 'error' | 'warning';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface CustomModalOptions {
  title?: string;
  dismissable?: boolean;
  maxWidth?: number;
  onClose?: () => void;
}

type ModalQueueItem =
  | {
      kind: 'alert';
      options: AlertOptions;
      resolve: () => void;
    }
  | {
      kind: 'confirm';
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'custom';
      content: ReactNode;
      options?: CustomModalOptions;
    };

interface ModalContextType {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  show: (content: ReactNode, options?: CustomModalOptions) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

// Global ref để showAlert có thể gọi ModalProvider nếu có
let globalModalContext: ModalContextType | null = null;
export const getGlobalModal = () => globalModalContext;

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<ModalQueueItem[]>([]);
  const activeItem = queue[0] ?? null;

  // Xử lý đóng modal hiện tại và chuyển sang mục tiếp theo trong hàng đợi
  const closeCurrent = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      if (current.kind === 'alert') {
        current.resolve();
      } else if (current.kind === 'confirm') {
        current.resolve(false);
      } else if (current.kind === 'custom' && current.options?.onClose) {
        current.options.onClose();
      }
      return prev.slice(1);
    });
  }, []);

  const handleAlertConfirm = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      if (current.kind === 'alert') {
        current.resolve();
      }
      return prev.slice(1);
    });
  }, []);

  const handleConfirmDecision = useCallback((choice: boolean) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      if (current.kind === 'confirm') {
        current.resolve(choice);
      }
      return prev.slice(1);
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    const normalized: AlertOptions =
      typeof options === 'string' ? { message: options } : options;

    return new Promise<void>((resolve) => {
      setQueue((prev) => [
        ...prev,
        {
          kind: 'alert',
          options: normalized,
          resolve,
        },
      ]);
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setQueue((prev) => [
        ...prev,
        {
          kind: 'confirm',
          options,
          resolve,
        },
      ]);
    });
  }, []);

  const show = useCallback((content: ReactNode, options?: CustomModalOptions) => {
    setQueue((prev) => [
      ...prev,
      {
        kind: 'custom',
        content,
        options,
      },
    ]);
  }, []);

  const close = useCallback(() => {
    closeCurrent();
  }, [closeCurrent]);

  const contextValue: ModalContextType = {
    alert,
    confirm,
    show,
    close,
  };

  useEffect(() => {
    globalModalContext = contextValue;
    return () => {
      globalModalContext = null;
    };
  }, [contextValue]);

  // Cấu hình icon và màu sắc cho từng loại alert
  const getTypeMeta = (type: ModalType = 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          badgeBg: '#DCFCE7',
          badgeColor: '#16A34A',
          defaultTitle: 'Thành công',
        };
      case 'error':
        return {
          icon: '✕',
          badgeBg: '#FEE2E2',
          badgeColor: '#DC2626',
          defaultTitle: 'Có lỗi xảy ra',
        };
      case 'warning':
        return {
          icon: '⚠️',
          badgeBg: '#FEF3C7',
          badgeColor: '#D97706',
          defaultTitle: 'Cảnh báo',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          badgeBg: '#E0F2FE',
          badgeColor: '#0284C7',
          defaultTitle: 'Thông báo',
        };
    }
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      {/* Render Modal hiện tại từ hàng đợi */}
      {activeItem && (
        <AppModal
          visible={true}
          onClose={closeCurrent}
          dismissable={
            activeItem.kind === 'custom'
              ? (activeItem.options?.dismissable ?? true)
              : activeItem.kind === 'alert'
              ? true
              : false
          }
          title={
            activeItem.kind === 'custom'
              ? activeItem.options?.title
              : activeItem.kind === 'alert'
              ? activeItem.options.title || getTypeMeta(activeItem.options.type).defaultTitle
              : activeItem.options.title || 'Xác nhận'
          }
          maxWidth={activeItem.kind === 'custom' ? activeItem.options?.maxWidth : 380}
        >
          {activeItem.kind === 'alert' && (
            <View style={styles.container}>
              {/* Type Badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getTypeMeta(activeItem.options.type).badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.badgeIcon,
                    { color: getTypeMeta(activeItem.options.type).badgeColor },
                  ]}
                >
                  {getTypeMeta(activeItem.options.type).icon}
                </Text>
              </View>

              {/* Message */}
              <Text style={[styles.message, { color: THEME.colors.textMuted }]}>
                {activeItem.options.message}
              </Text>

              {/* Action Button */}
              <Pressable
                onPress={handleAlertConfirm}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận"
                style={({ pressed }) => [
                  styles.fullButton,
                  {
                    backgroundColor: THEME.colors.primary,
                    borderRadius: THEME.radius.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {activeItem.options.confirmText || 'Đã hiểu'}
                </Text>
              </Pressable>
            </View>
          )}

          {activeItem.kind === 'confirm' && (
            <View style={styles.container}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: activeItem.options.destructive ? '#FEE2E2' : '#EFF6FF',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeIcon,
                    {
                      color: activeItem.options.destructive
                        ? '#DC2626'
                        : THEME.colors.primary,
                    },
                  ]}
                >
                  {activeItem.options.destructive ? '⚠️' : '❓'}
                </Text>
              </View>

              <Text style={[styles.message, { color: THEME.colors.textMuted }]}>
                {activeItem.options.message}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => handleConfirmDecision(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Hủy"
                  style={({ pressed }) => [
                    styles.halfButton,
                    {
                      backgroundColor: '#F1F5F9',
                      borderRadius: THEME.radius.md,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: THEME.colors.textMain }]}>
                    {activeItem.options.cancelText || 'Hủy'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleConfirmDecision(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Đồng ý"
                  style={({ pressed }) => [
                    styles.halfButton,
                    {
                      backgroundColor: activeItem.options.destructive
                        ? THEME.colors.danger
                        : THEME.colors.primary,
                      borderRadius: THEME.radius.md,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {activeItem.options.confirmText || 'Đồng ý'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeItem.kind === 'custom' && activeItem.content}
        </AppModal>
      )}
    </ModalContext.Provider>
  );
};

export const useAppModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useAppModal phải được sử dụng bên trong <ModalProvider>');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  fullButton: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  halfButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});