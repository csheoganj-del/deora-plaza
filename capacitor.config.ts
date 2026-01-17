import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deoraplaza.app',
  appName: 'Deora Plaza',
  webDir: 'public',
  server: {
    // This points to your live Vercel deployment
    // Ensure this URL is correct and up-to-date!
    url: 'https://deora-plaza-master.vercel.app',
    cleartext: true
  },
  android: {
    // Disable overview mode to prevent desktop-like scaling
    webContentsDebuggingEnabled: true,
    // Additional Android-specific settings
    allowMixedContent: true
  }
};

export default config;
