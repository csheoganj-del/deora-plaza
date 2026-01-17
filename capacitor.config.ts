import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deoraplaza.app',
  appName: 'Deora Plaza',
  webDir: 'public',
  server: {
    // Local Development URL (Hot Reload)
    // Live Production Server
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
