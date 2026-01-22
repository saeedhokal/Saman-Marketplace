import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saeed.saman',
  appName: 'Saman Marketplace',
  webDir: 'dist/public',
  server: {
    url: 'https://saman-market-fixer--saeedhokal.replit.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#F5F6F8',
    scrollEnabled: true,
    allowsLinkPreview: false,
    overrideUserInterfaceStyle: 'light',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3a4553',
      showSpinner: false,
    },
  },
};

export default config;
