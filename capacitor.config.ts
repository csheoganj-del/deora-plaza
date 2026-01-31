import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deoraplaza.app',
  appName: 'Deora Plaza',
  webDir: 'public',
  server: {
    // Local Development URL - Waiter Dashboard
    url: 'http://192.168.1.4:3000/dashboard/waiter',
    // For production, use: 'https://deora-plaza-master.vercel.app/dashboard/waiter'
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
