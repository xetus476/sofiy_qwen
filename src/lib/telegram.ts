// Telegram Web App API wrapper

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          setText: (text: string) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        expand: () => void;
        ready: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
      };
    };
  }
}

export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

export function hapticLight() {
  tg?.HapticFeedback?.impactOccurred('light');
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success');
}

export function hapticError() {
  tg?.HapticFeedback?.notificationOccurred('error');
}

export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged();
}

export function getThemeColors() {
  if (!tg) {
    return {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f0f0f0',
    };
  }
  return {
    bg_color: tg.themeParams.bg_color || '#ffffff',
    text_color: tg.themeParams.text_color || '#000000',
    hint_color: tg.themeParams.hint_color || '#999999',
    button_color: tg.themeParams.button_color || '#3390ec',
    button_text_color: tg.themeParams.button_text_color || '#ffffff',
    secondary_bg_color: tg.themeParams.secondary_bg_color || '#f0f0f0',
  };
}

export function getColorScheme(): 'light' | 'dark' {
  return tg?.colorScheme || 'light';
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}
