import { Alert, Platform } from 'react-native';

type AppAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export const showAlert = (title: string, message: string, buttons?: AppAlertButton[]) => {
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
