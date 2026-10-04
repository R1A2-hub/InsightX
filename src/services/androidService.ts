import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const getClientPlatform = (): 'android' | 'ios' | 'web' => {
  if (Capacitor.isNativePlatform()) {
    const p = Capacitor.getPlatform();
    return p === 'android' ? 'android' : p === 'ios' ? 'ios' : 'web';
  }
  return 'web';
};

export async function initializeAndroidEnvironment(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Configure Android status bar to match InsightX dark theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
  } catch (err) {
    console.debug('StatusBar initialization skipped:', err);
  }

  try {
    // Hide native splash screen once React is mounted
    await SplashScreen.hide({ fadeOutDuration: 400 });
  } catch (err) {
    console.debug('SplashScreen hide skipped:', err);
  }
}

export function registerAndroidBackButtonHandler(handlers: {
  isDrawerOpen: () => boolean;
  closeDrawer: () => void;
  canNavigateBack: () => boolean;
  navigateBack: () => void;
}): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  let listenerPromise = App.addListener('backButton', () => {
    // 1. If mobile navigation drawer is open, close it
    if (handlers.isDrawerOpen()) {
      handlers.closeDrawer();
      return;
    }

    // 2. If user is in a sub-section (e.g. Chat, Analytics, Settings), navigate back to Dashboard
    if (handlers.canNavigateBack()) {
      handlers.navigateBack();
      return;
    }

    // 3. Otherwise on Dashboard, exit the Android app
    App.exitApp();
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
}
