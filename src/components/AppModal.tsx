import React from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { THEME } from '../constants/theme';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dismissable?: boolean;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  footer,
  maxWidth = 400,
}) => {
  const handleBackdropPress = () => {
    if (dismissable) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (dismissable) {
          onClose();
        }
      }}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.card,
              {
                maxWidth,
                backgroundColor: THEME.colors.card,
                borderRadius: THEME.radius.lg,
                borderColor: THEME.colors.borderLight,
              },
            ]}
          >
            {/* Header */}
            {(title || dismissable) && (
              <View style={styles.header}>
                <Text
                  style={[styles.title, { color: THEME.colors.textMain }]}
                  numberOfLines={1}
                >
                  {title ?? ''}
                </Text>

                {dismissable && (
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Đóng"
                    style={({ pressed }) => [
                      styles.closeBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.closeIcon, { color: THEME.colors.textMuted }]}>
                      ✕
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Content body */}
            <View style={styles.body}>{children}</View>

            {/* Footer */}
            {footer && <View style={styles.footer}>{footer}</View>}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  body: {
    width: '100%',
  },
  footer: {
    width: '100%',
    paddingTop: 12,
  },
});